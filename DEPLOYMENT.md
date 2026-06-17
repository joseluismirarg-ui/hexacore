# Guía de Despliegue de Producción 🚀

Bienvenido al manual definitivo para llevar **Hexa Core Global** a la nube.

## Prerrequisitos
1. Una cuenta en [Railway](https://railway.app/) o [Render](https://render.com/).
2. Una cuenta en [Stripe](https://stripe.com/).
3. Un repositorio público o privado en GitHub.

---

## Opción 1: Despliegue Automatizado en Railway (Recomendado)

Railway detectará automáticamente el `Dockerfile` y provisionará la aplicación en un solo servicio.

1. **Crear Proyecto:** Inicia un nuevo proyecto en Railway y selecciona "Provision PostgreSQL".
2. **Conectar GitHub:** Selecciona "Deploy from GitHub repo" y elige el repositorio de Hexa Core.
3. **Variables de Entorno:** Ve a la pestaña "Variables" del servicio `app` en Railway e ingresa las variables listadas en tu `stripe.env.template`:
   ```bash
   NODE_ENV=production
   DATABASE_URL= # (Proporcionada por el servicio PostgreSQL de Railway automáticamente)
   JWT_SECRET=tu_secreto_seguro_y_largo
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_BASIC=price_...
   STRIPE_PRICE_PRO=price_...
   STRIPE_PRICE_ENTERPRISE=price_...
   FRONTEND_URL=https://tu-dominio.com
   ```
4. **Dominio Personalizado:** En la pestaña "Settings" > "Domains", haz clic en "Generate Domain" para tener un `.up.railway.app` o vincula tu dominio `tu-dominio.com` mediante registros CNAME.

---

## Opción 2: VPS con Docker Compose (DigitalOcean / AWS EC2)

1. Ingresa a tu servidor Ubuntu vía SSH.
2. Clona tu repositorio: `git clone https://github.com/tu-usuario/hexacore.git`.
3. Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla.
4. Ejecuta:
   ```bash
   docker-compose up -d --build
   ```
5. Esto levantará PostgreSQL (`db`) y la App Node.js (`app`) conectadas en la misma red interna. Configura tu Nginx como Reverse Proxy hacia `localhost:3000`.

---

## Migraciones de Base de Datos
El `Dockerfile` incluye un comando crítico de arranque:
`CMD npx prisma migrate deploy && node dist/server.js`

Esto garantiza que cada vez que subas código con un esquema de base de datos modificado, Prisma aplicará la migración antes de encender el servidor. ¡Despreocúpate de las migraciones manuales!

---

## ¿Cómo Funciona la Compilación (Build)?
Hemos utilizado un **Dockerfile Multi-Stage**:
1. Construye los activos estáticos del Frontend en la carpeta `/app/frontend/dist`.
2. Transpila el código de TypeScript de `/src` del Backend y genera el Prisma Client.
3. Toma ambas construcciones limpias y corre el Backend, que automáticamente intercepta peticiones que no sean `/api/*` para servir tu Frontend de React optimizado (Cero configuraciones CORS extra en prod).
