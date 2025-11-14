import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import nodemailer from 'nodemailer'
import axios from 'axios'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import admin from 'firebase-admin'

const app = express()
const __dirname = path.resolve()
const UPLOAD_DIR = path.join(__dirname, 'server_public')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// simple storage with multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname.replace(/[^a-z0-9\.\-]/gi, '_')
    cb(null, unique)
  }
})
const upload = multer({ storage })

// Initialize S3 client if configured
let s3Client = null
if (process.env.USE_S3 === 'true') {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })
}

// Initialize Firebase Admin SDK if requested (used to upload files to Firebase Storage)
let firebaseAdminInitialized = false
if (process.env.USE_FIREBASE_STORAGE === 'true') {
  try {
    let serviceAccount = null
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const saPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'))
    }

    if (!serviceAccount) throw new Error('No Firebase service account provided')

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined
    })
    firebaseAdminInitialized = true
    console.log('Firebase Admin initialized for Storage')
  } catch (err) {
    console.error('Failed to init Firebase Admin:', err.message || err)
  }
}

// simple auth middleware using API key (Authorization: Bearer <API_KEY>)
function requireApiKey(req, res, next){
  const header = req.headers.authorization || ''
  const parts = header.split(' ')
  if(parts.length === 2 && parts[0] === 'Bearer' && process.env.API_KEY && parts[1] === process.env.API_KEY) return next()
  return res.status(401).json({ error: 'Unauthorized' })
}

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(UPLOAD_DIR))

// POST /api/upload -> multipart form field 'file'
app.post('/api/upload', requireApiKey, upload.single('file'), async (req, res) => {
  if(!req.file) return res.status(400).json({ error: 'No file uploaded' })

  // If S3 is enabled, upload to S3 and return S3 URL
  if(s3Client){
    try{
      const fileContent = fs.readFileSync(req.file.path)
      const key = `uploads/${req.file.filename}`
      const cmd = new PutObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key, Body: fileContent, ContentType: req.file.mimetype })
      await s3Client.send(cmd)
      const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      // Optionally delete local file
      try{ fs.unlinkSync(req.file.path) }catch(e){}
      return res.json({ url: s3Url, filename: req.file.filename })
    }catch(err){
      console.error('S3 upload error', err)
      return res.status(500).json({ error: 'S3 upload failed' })
    }
  }

  // If Firebase Storage is enabled, upload to bucket and return signed URL
  if (firebaseAdminInitialized) {
    try {
      const bucket = admin.storage().bucket()
      const key = `uploads/${req.file.filename}`
      await bucket.upload(req.file.path, { destination: key, metadata: { contentType: req.file.mimetype } })
      const file = bucket.file(key)
      // Generate a long-lived signed URL
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' })
      try { fs.unlinkSync(req.file.path) } catch (e) {}
      return res.json({ url: signedUrl, filename: req.file.filename })
    } catch (err) {
      console.error('Firebase Storage upload error', err)
      // fall through to local hosting fallback
    }
  }

  // fallback to local static hosting
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  return res.json({ url, filename: req.file.filename })
})

// POST /api/send-email -> { to, subject, text, fileUrl }
app.post('/api/send-email', requireApiKey, async (req, res) => {
  const { to, subject, text, fileUrl } = req.body
  if(!to) return res.status(400).json({ error: 'Missing recipient' })

  // transporter config must come from env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  })

  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject: subject || 'Documento',
    text: text || 'Adjunto documento',
    attachments: []
  }

  try {
    if (fileUrl) {
      // if it's an absolute URL on this server, download the file and attach
      const resp = await axios.get(fileUrl, { responseType: 'arraybuffer' })
      mailOptions.attachments.push({ filename: path.basename(fileUrl), content: Buffer.from(resp.data) })
    }

    const info = await transporter.sendMail(mailOptions)
    return res.json({ ok: true, info })
  } catch (err) {
    console.error('send-email error', err)
    return res.status(500).json({ error: String(err) })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, ()=> console.log('Server listening on', PORT))
