Instrucciones de despliegue y uso - Vidriería Vite Project

Resumen
- Frontend: React + Vite
- Backend (opcional): simple Express server para recibir uploads y enviar emails

Pasos locales (desarrollo)
1) Clona/usa el repositorio y entra a la carpeta del proyecto

```bash
cd "/c/Users/ybarr/Nueva carpeta/vite-project"
```

2) Instala dependencias (frontend + server)

```bash
npm install
# Dependencias backend (si faltan):
npm install express multer cors nodemailer axios @aws-sdk/client-s3
```

3) Variables de entorno
- Crea un archivo `.env` en la raíz (puedes copiar `.env.example` y completarlo).
- Variables importantes:
  - `API_KEY` : clave secreta para proteger endpoints del servidor. Debes usarla en frontend como `VITE_API_KEY`.
  - `SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM` : para envío de emails.
  - `USE_S3` (true|false) y `AWS_*` si quieres almacenar PDFs en S3.
  - `VITE_API_KEY` y `VITE_SERVER_URL` en el archivo `.env` del frontend (prefijo VITE_ para que Vite las exponga). Ejemplo en `.env`:

```
VITE_API_KEY=tu_api_key
VITE_SERVER_URL=http://localhost:4000
```

4) Ejecutar backend (opcional, si querés usar envíos por email o subir PDFs)

```bash
npm run start:server
```

- Esto ejecutará `server/index.js` en el puerto que definas en `PORT` (por defecto 4000).
- Asegurate que `API_KEY` esté configurada tanto en el backend (.env) como en el frontend `VITE_API_KEY`.

5) Ejecutar frontend

```bash
npm run dev
```

6) Rutas importantes de la app
- /presupuestos → crear, guardar, descargar, enviar WhatsApp o email (requiere servidor para envio/email)
- /pagos → registrar pagos y ver pagos persistidos
- /clientes-credito → gestionar clientes con crédito

Notas de seguridad y producción
- Protege `API_KEY` (no lo pongas en repositorios públicos). En producción genera una API_KEY fuerte y almacénala en el entorno del servidor y en las variables de entorno del build del frontend (VITE_API_KEY).
- El servidor de ejemplo no implementa autenticación de usuarios. Añadí un middleware simple basado en API_KEY. Para producción usar OAuth/JWT y TLS.
- Si activás `USE_S3=true`, el servidor intentará subir los PDFs a S3 usando `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`.
- Para envío de emails, configura `SMTP_*` con un proveedor (por ejemplo SendGrid, Mailgun, o SMTP de tu hosting).

Limpieza de archivos
- Cuando USE_S3=true el servidor elimina el archivo local luego de subirlo. Si usás almacenamiento local, revisa la carpeta `server_public` para gestionar limpieza periódica.

Soporte para WhatsApp
- El flujo actual genera PDF, lo sube al servidor, y abre WhatsApp Web con un mensaje que incluye el enlace al PDF. WhatsApp no permite adjuntar archivos mediante `wa.me`, por eso el método usa un link público.

Información adicional
- Para integrar WhatsApp Business API o envío por WhatsApp directo (sin usuario), necesitás una cuenta y un backend que use la API oficial.
- Para integrar un almacenamiento profesional (S3) y hosting de archivos, asegúrate de configurar correctamente permisos del bucket (presigned URLs o policy segura).

Si querés, puedo:
- Añadir spinner/feedback más detallado en más vistas.
- Implementar un job que elimine archivos locales viejos automáticamente.
- Migrar la gestión de clientes al `StoreContext` para centralizar datos.

