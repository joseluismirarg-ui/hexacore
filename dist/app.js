"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/app.ts v2.0
// Todos los módulos del ERP registrados.
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middleware/errorHandler");
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const cobranza_routes_1 = __importDefault(require("./routes/cobranza.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const cliente_routes_1 = __importDefault(require("./routes/cliente.routes"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const inventario_routes_1 = __importDefault(require("./routes/inventario.routes"));
const item_routes_1 = __importDefault(require("./routes/item.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const purchase_routes_1 = __importDefault(require("./routes/purchase.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const hr_routes_1 = __importDefault(require("./routes/hr.routes"));
const config_routes_1 = __importDefault(require("./routes/config.routes"));
const treasury_routes_1 = __importDefault(require("./routes/treasury.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const manufacturing_routes_1 = __importDefault(require("./routes/manufacturing.routes"));
const sales_order_routes_1 = __importDefault(require("./routes/sales-order.routes"));
const logistics_routes_1 = __importDefault(require("./routes/logistics.routes"));
const tenant_routes_1 = __importDefault(require("./routes/tenant.routes"));
const landlord_routes_1 = __importDefault(require("./routes/landlord.routes"));
const billing_routes_1 = __importDefault(require("./routes/billing.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const ticket_routes_1 = __importDefault(require("./routes/ticket.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const truck_routes_1 = __importDefault(require("./routes/truck.routes"));
const driver_routes_1 = __importDefault(require("./routes/driver.routes"));
const tenant_middleware_1 = require("./middleware/tenant.middleware");
const swagger_1 = require("./docs/swagger");
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const bulk_import_routes_1 = __importDefault(require("./routes/bulk-import.routes"));
const cxc_routes_1 = __importDefault(require("./routes/cxc.routes"));
const stripe_routes_1 = __importDefault(require("./routes/stripe.routes"));
const stripe_controller_1 = require("./controllers/stripe.controller");
const superadmin_routes_1 = __importDefault(require("./routes/superadmin.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const app = (0, express_1.default)();
// =============================================================================
// MIDDLEWARES DE SEGURIDAD Y PARSING
// =============================================================================
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://*.supabase.co", "https://xlqdteghltctdorrpfdo.supabase.co"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
    },
}));
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
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
app.use((0, cors_1.default)(corsOptions));
// =============================================================================
// WEBHOOKS (DEBEN IR ANTES DE EXPRESS.JSON PARA MANTENER EL RAW BODY)
// =============================================================================
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), webhook_routes_1.default);
app.post('/api/stripe/webhook', express_1.default.raw({ type: 'application/json' }), stripe_controller_1.StripeController.webhook);
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// =============================================================================
// MIDDLEWARE: EXTRACTOR DE IDEMPOTENCY-KEY Y TENANT
// =============================================================================
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
app.use((req, _res, next) => {
    const rawKey = req.header('Idempotency-Key') ?? req.header('idempotency-key');
    if (rawKey) {
        if (UUID_V4_REGEX.test(rawKey)) {
            req.idempotencyKey = rawKey;
        }
        else {
            console.warn(`[IDEMPOTENCY] Header con formato inválido (esperado UUID v4): "${rawKey}"`);
        }
    }
    next();
});
// app.use(tenantMiddleware); // Movido a nivel de ruta para ejecutarse DESPUÉS de authenticateToken
// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'hexa-core-api',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? 'development',
        dbUrl: process.env.DATABASE_URL?.substring(0, 30) + '...'
    });
});
// =============================================================================
// RUTAS PÚBLICAS
// =============================================================================
app.use('/api/auth', auth_routes_1.default);
// =============================================================================
// RUTAS DE LA API — ERP v2.0 (PROTEGIDAS)
// =============================================================================
app.use('/api/transactions', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, transaction_routes_1.default);
app.use('/api/collections', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, cobranza_routes_1.default);
app.use('/api/dashboard', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, dashboard_routes_1.default);
app.use('/api/customers', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, cliente_routes_1.default);
app.use('/api/users', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, usuario_routes_1.default);
app.use('/api/inventory', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, inventario_routes_1.default);
app.use('/api/products', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, item_routes_1.default);
app.use('/api/payments', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, payment_routes_1.default);
app.use('/api/purchases', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, purchase_routes_1.default);
app.use('/api/invoices', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, invoice_routes_1.default);
app.use('/api/warehouses', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, location_routes_1.default);
app.use('/api/hr', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, hr_routes_1.default);
app.use('/api/subscription', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, subscription_routes_1.default);
app.use('/api/tickets', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, ticket_routes_1.default);
app.use('/api/config', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, config_routes_1.default);
app.use('/api/treasury', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, treasury_routes_1.default);
app.use('/api/admin', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, admin_routes_1.default);
app.use('/api/driver', driver_routes_1.default);
app.use('/api/manufacturing', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, manufacturing_routes_1.default);
app.use('/api/sales-orders', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, sales_order_routes_1.default);
app.use('/api/logistics', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, logistics_routes_1.default);
app.use('/api/tenants', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, tenant_routes_1.default);
app.use('/api/landlord', auth_middleware_1.authenticateToken, auth_middleware_1.requireSuperAdmin, tenant_middleware_1.tenantMiddleware, landlord_routes_1.default);
app.use('/api/v1/superadmin', auth_middleware_1.authenticateToken, auth_middleware_1.requireSuperAdmin, tenant_middleware_1.tenantMiddleware, superadmin_routes_1.default);
app.use('/api/billing', billing_routes_1.default); // Público por webhook
app.use('/api/analytics', auth_middleware_1.authenticateToken, tenant_middleware_1.tenantMiddleware, analytics_routes_1.default);
app.use('/api/trucks', auth_middleware_1.authenticateToken, truck_routes_1.default);
app.use('/api/bulk-import', auth_middleware_1.authenticateToken, bulk_import_routes_1.default);
app.use('/api/cxc', auth_middleware_1.authenticateToken, cxc_routes_1.default);
app.use('/api/stripe', auth_middleware_1.authenticateToken, stripe_routes_1.default);
// Servir siempre el frontend compilado (ignorar NODE_ENV para evitar 404s en Railway)
app.use(express_1.default.static(path_1.default.join(__dirname, '../frontend/dist')));
// Cualquier ruta que no sea de la API, servirá el index.html del frontend
app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path_1.default.join(__dirname, '../frontend/dist/index.html'));
    }
    else {
        next();
    }
});
// =============================================================================
// 404 CATCH-ALL PARA LA API
// =============================================================================
app.use('/api/*', (_req, res) => {
    res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'La ruta solicitada no existe en esta API',
    });
});
// =============================================================================
// ERROR HANDLER GLOBAL — SIEMPRE AL FINAL
// =============================================================================
app.use(errorHandler_1.errorHandler);
exports.default = app;
(0, swagger_1.setupSwagger)(app);
//# sourceMappingURL=app.js.map