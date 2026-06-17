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
const errorHandler_1 = require("./middleware/errorHandler");
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const cobranza_routes_1 = __importDefault(require("./routes/cobranza.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const cliente_routes_1 = __importDefault(require("./routes/cliente.routes"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const inventario_routes_1 = __importDefault(require("./routes/inventario.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const purchase_routes_1 = __importDefault(require("./routes/purchase.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const warehouse_routes_1 = __importDefault(require("./routes/warehouse.routes"));
const hr_routes_1 = __importDefault(require("./routes/hr.routes"));
const config_routes_1 = __importDefault(require("./routes/config.routes"));
const treasury_routes_1 = __importDefault(require("./routes/treasury.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const app = (0, express_1.default)();
// =============================================================================
// MIDDLEWARES DE SEGURIDAD Y PARSING
// =============================================================================
app.use((0, helmet_1.default)());
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
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// =============================================================================
// MIDDLEWARE: EXTRACTOR DE IDEMPOTENCY-KEY
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
    });
});
// =============================================================================
// RUTAS PÚBLICAS
// =============================================================================
app.use('/api/auth', auth_routes_1.default);
// =============================================================================
// RUTAS DE LA API — ERP v2.0 (PROTEGIDAS)
// =============================================================================
app.use('/api/transactions', auth_middleware_1.authenticateToken, transaction_routes_1.default);
app.use('/api/collections', auth_middleware_1.authenticateToken, cobranza_routes_1.default);
app.use('/api/dashboard', auth_middleware_1.authenticateToken, dashboard_routes_1.default);
app.use('/api/customers', auth_middleware_1.authenticateToken, cliente_routes_1.default);
app.use('/api/users', auth_middleware_1.authenticateToken, usuario_routes_1.default);
app.use('/api/inventory', auth_middleware_1.authenticateToken, inventario_routes_1.default);
app.use('/api/products', auth_middleware_1.authenticateToken, product_routes_1.default);
app.use('/api/payments', auth_middleware_1.authenticateToken, payment_routes_1.default);
app.use('/api/purchases', auth_middleware_1.authenticateToken, purchase_routes_1.default);
app.use('/api/invoices', auth_middleware_1.authenticateToken, invoice_routes_1.default);
app.use('/api/warehouses', auth_middleware_1.authenticateToken, warehouse_routes_1.default);
app.use('/api/hr', auth_middleware_1.authenticateToken, hr_routes_1.default);
app.use('/api/config', auth_middleware_1.authenticateToken, config_routes_1.default);
app.use('/api/treasury', auth_middleware_1.authenticateToken, treasury_routes_1.default);
app.use('/api/admin', auth_middleware_1.authenticateToken, admin_routes_1.default);
// =============================================================================
// 404 CATCH-ALL
// =============================================================================
app.use((_req, res) => {
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
//# sourceMappingURL=app.js.map