# ==============================================================================
# HEXA CORE GLOBAL - MULTI-STAGE DOCKERFILE
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Build Frontend (React / Vite)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: Build Backend (Node.js / Express / TypeScript / Prisma)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Instalar OpenSSL requerido por Prisma
RUN apk add --no-cache openssl

# Copiar dependencias de raíz
COPY package*.json ./
RUN npm ci

# Copiar Prisma schema y generar cliente
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copiar el código fuente y compilar
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 3: Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

# Set Production
ENV NODE_ENV=production

# Copiar de los builders
COPY package*.json ./
# Instalamos solo dependencias de producción
RUN npm ci --omit=dev

COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma

# Copiar el build del frontend para servirlo estáticamente desde Express
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Exponer el puerto
EXPOSE 3000

CMD npx prisma db push --accept-data-loss && node dist/server.js
