"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDemoSession = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
const giros_seed_1 = require("../lib/giros.seed");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Faltan credenciales' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }
        // TODO: Implement Supabase Auth validation (Server-Side)
        // El frontend ahora enviará el JWT de Supabase, por lo que el login local 
        // debe ser refactorizado o manejado vía Supabase.
        const isMatch = true;
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, tenantId: user.tenantId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '12h' });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.login = login;
const createDemoSession = async (_req, res) => {
    try {
        const demoId = `demo-${Date.now()}`;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours expiration
        // 1. Create temporary Tenant
        const demoTenant = await prisma_1.prisma.tenant.create({
            data: {
                name: `Demo en Vivo - ${demoId}`,
                industry: 'RETAIL',
                plan: 'PRO',
                status: 'TRIAL',
                expiresAt: expiresAt
            }
        });
        // 2. Inject Data
        await (0, giros_seed_1.seedIndustryTemplates)(prisma_1.prisma, demoTenant.id, 'RETAIL');
        // 3. Create Demo Admin User
        const demoUser = await prisma_1.prisma.user.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                email: `demo@${demoId}.com`,
                name: 'Demo Admin',
                role: 'ADMIN',
                tenantId: demoTenant.id
            }
        });
        // 4. Create System Config
        await prisma_1.prisma.systemConfig.create({
            data: {
                tenantId: demoTenant.id,
                companyName: `Demo en Vivo - ${demoId}`,
                companyRfc: 'XAXX010101000',
                taxRegimen: '601',
                posTimeout: 300
            }
        });
        // 5. Generate JWT Token
        const token = jsonwebtoken_1.default.sign({
            userId: demoUser.id,
            role: demoUser.role,
            tenantId: demoUser.tenantId
        }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '2h' });
        res.json({ token, user: demoUser, tenant: demoTenant });
    }
    catch (error) {
        console.error('[Demo] Error creando sesión demo:', error);
        res.status(500).json({ error: 'Error creando la sesión demo' });
    }
};
exports.createDemoSession = createDemoSession;
//# sourceMappingURL=auth.controller.js.map