// =============================================================================
// HEXA CORE SYSTEMS — src/app.ts v2.0
// Todos los módulos del ERP registrados.
// =============================================================================

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import transactionRoutes from './routes/transaction.routes';
import cobranzaRoutes from './routes/cobranza.routes';
import dashboardRoutes from './routes/dashboard.routes';
import clienteRoutes from './routes/cliente.routes';
import usuarioRoutes from './routes/usuario.routes';
import inventarioRoutes from './routes/inventario.routes';
import productRoutes from './routes/item.routes';
import paymentRoutes from './routes/payment.routes';
import purchaseRoutes from './routes/purchase.routes';
import invoiceRoutes from './routes/invoice.routes';
import locationRoutes from './routes/location.routes';
import hrRoutes from './routes/hr.routes';
import configRoutes from './routes/config.routes';
import treasuryRoutes from './routes/treasury.routes';
import adminRoutes from './routes/admin.routes';
import manufacturingRoutes from './routes/manufacturing.routes';
import salesOrderRoutes from './routes/sales-order.routes';
import logisticsRoutes from './routes/logistics.routes';
import tenantRoutes from './routes/tenant.routes';
import landlordRoutes from './routes/landlord.routes';
import billingRoutes from './routes/billing.routes';
import subscriptionRoutes from './routes/subscription.routes';
import ticketRoutes from './routes/ticket.routes';
import analyticsRoutes from './routes/analytics.routes';
import truckRoutes from './routes/truck.routes';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { setupSwagger } from './docs/swagger';
import webhookRoutes from './routes/webhook.routes';

import authRoutes from './routes/auth.routes';
import { authenticateToken } from './middleware/auth.middleware';

const app: Application = express();

// =============================================================================
// MIDDLEWARES DE SEGURIDAD Y PARSING
// =============================================================================
app.use(helmet());

const corsOptions: cors.CorsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL ?? '').split(',').map((o) => o.trim())
      : '*', // En desarrollo permitir todo
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Idempotency-Key',
    'idempotency-key',
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// =============================================================================
// WEBHOOKS (DEBEN IR ANTES DE EXPRESS.JSON PARA MANTENER EL RAW BODY)
// =============================================================================
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// MIDDLEWARE: EXTRACTOR DE IDEMPOTENCY-KEY Y TENANT
// =============================================================================
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

app.use((req: Request, _res: Response, next: NextFunction): void => {
  const rawKey = req.header('Idempotency-Key') ?? req.header('idempotency-key');
  if (rawKey) {
    if (UUID_V4_REGEX.test(rawKey)) {
      req.idempotencyKey = rawKey;
    } else {
      console.warn(
        `[IDEMPOTENCY] Header con formato inválido (esperado UUID v4): "${rawKey}"`
      );
    }
  }
  next();
});

app.use(tenantMiddleware);

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'hexa-core-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// =============================================================================
// RUTAS PÚBLICAS
// =============================================================================
app.use('/api/auth', authRoutes);

// =============================================================================
// RUTAS DE LA API — ERP v2.0 (PROTEGIDAS)
// =============================================================================
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/collections', authenticateToken, cobranzaRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/customers', authenticateToken, clienteRoutes);
app.use('/api/users', authenticateToken, usuarioRoutes);
app.use('/api/inventory', authenticateToken, inventarioRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/purchases', authenticateToken, purchaseRoutes);
app.use('/api/invoices', authenticateToken, invoiceRoutes);
app.use('/api/locations', authenticateToken, locationRoutes);
app.use('/api/hr', authenticateToken, hrRoutes);
app.use('/api/subscription', authenticateToken, subscriptionRoutes);
app.use('/api/tickets', authenticateToken, ticketRoutes);
app.use('/api/config', authenticateToken, configRoutes);
app.use('/api/treasury', authenticateToken, treasuryRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/manufacturing', authenticateToken, manufacturingRoutes);
app.use('/api/sales-orders', authenticateToken, salesOrderRoutes);
app.use('/api/logistics', authenticateToken, logisticsRoutes);
app.use('/api/tenants', authenticateToken, tenantRoutes);
app.use('/api/landlord', authenticateToken, landlordRoutes);
app.use('/api/billing', billingRoutes); // Público por webhook
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/trucks', authenticateToken, truckRoutes);

// Servir siempre el frontend compilado (ignorar NODE_ENV para evitar 404s en Railway)
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Cualquier ruta que no sea de la API, servirá el index.html del frontend
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    } else {
      next();
    }
  });

// =============================================================================
// 404 CATCH-ALL PARA LA API
// =============================================================================
app.use('/api/*', (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'La ruta solicitada no existe en esta API',
  });
});

// =============================================================================
// ERROR HANDLER GLOBAL — SIEMPRE AL FINAL
// =============================================================================
app.use(errorHandler);

export default app;

setupSwagger(app);
