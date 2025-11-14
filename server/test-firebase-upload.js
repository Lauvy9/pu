/**
 * Test script para verificar la configuración de Firebase Admin y Storage.
 * Uso: antes de ejecutar asegúrate de tener FIREBASE_SERVICE_ACCOUNT_PATH o FIREBASE_SERVICE_ACCOUNT_JSON en el env.
 */
import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

async function main(){
  try{
    let serviceAccount = null
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) serviceAccount = JSON.parse(fs.readFileSync(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),'utf8'))
    else throw new Error('No service account provided')

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: process.env.FIREBASE_STORAGE_BUCKET })
    const bucket = admin.storage().bucket()
    console.log('Firebase Admin initialized. Bucket:', bucket.name)

    // Crear un pequeño archivo temporal y subirlo
    const tmp = path.join(process.cwd(),'server','test-upload.txt')
    fs.writeFileSync(tmp, 'Firebase upload test ' + new Date().toISOString())
    const dest = 'tests/test-upload-' + Date.now() + '.txt'
    await bucket.upload(tmp, { destination: dest })
    console.log('Uploaded test file to', dest)
    const file = bucket.file(dest)
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' })
    console.log('Signed URL:', url)
    fs.unlinkSync(tmp)
    process.exit(0)
  }catch(err){
    console.error('Test upload failed:', err)
    process.exit(1)
  }
}

main()
