# Hardening y Seguridad para Producción 🛡️

Esta guía detalla las configuraciones necesarias para blindar Hexa Core Global antes de su salida a Internet.

## 1. Helmet (Cabeceras de Seguridad HTTP)
El backend ya tiene instalado `helmet` en `src/app.ts`, el cual activa por defecto protección contra XSS, Clickjacking, y Sniffing de MIME types.

**En caso de usar APIs externas (como Stripe Elements en el Frontend):**
Asegúrate de configurar la Content-Security-Policy (CSP) en `helmet`:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
}));
```

## 2. HTTPS (Terminación SSL/TLS)
Node.js (Express) no debe manejar los certificados SSL directamente. Se debe delegar esta tarea a un **Proxy Inverso**.
Si usas plataformas como **Railway** o **Render**, ellos aprovisionan certificados SSL de Let's Encrypt automáticamente de forma gratuita.

Si decides usar un VPS manual (AWS EC2, DigitalOcean Droplet), usa **Nginx** frente al contenedor Docker:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Nota: La configuración de WebSockets (`Upgrade $http_upgrade`) es crítica para que las notificaciones en vivo funcionen.*

## 3. Limitación de Tasas (Rate Limiting)
Para proteger tus endpoints de ataques de fuerza bruta (especialmente el endpoint de login y el webhook de Stripe), te sugerimos instalar `express-rate-limit` en futuras iteraciones si la plataforma no lo provee a nivel de red (Cloudflare).

## 4. Archivos de Testing y Simuladores
Antes de un despliegue, **nunca** subas scripts de simulación de carga (`stress-test-simulator.ts`) al repositorio de producción si contienen credenciales o lógicas destructivas. El protocolo actual ya los elimina en la fase de limpieza.
