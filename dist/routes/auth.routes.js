"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
// GET /api/auth/seed-test-pro — TEMPORARY ROUTE to create a pro test account
router.get('/seed-test-pro', async (_req, res, next) => {
    try {
        const tenant = await prisma_1.prisma.tenant.create({
            data: {
                name: 'Hexa Core Pro Test',
                industry: 'GENERAL'
            }
        });
        const passwordHash = await bcrypt_1.default.hash('prueba1', 10);
        const user = await prisma_1.prisma.user.upsert({
            where: { email: 'prueba1@prueba1.com' },
            update: {
                passwordHash,
                tenantId: tenant.id,
                role: 'ADMIN'
            },
            create: {
                name: 'Administrador Pro',
                email: 'prueba1@prueba1.com',
                passwordHash,
                role: 'ADMIN',
                tenantId: tenant.id
            }
        });
        res.json({ success: true, message: 'Cuenta PRO creada', email: user.email, password: 'prueba1' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión de un usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token y data del usuario.
 *       401:
 *         description: Credenciales inválidas.
 */
router.post('/login', auth_controller_1.login);
/**
 * @swagger
 * /api/auth/demo:
 *   post:
 *     summary: Crea una sesión de demostración efímera de 2 horas.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Retorna un token temporal y los datos del Tenant de demostración inyectado con datos falsos.
 */
router.post('/demo', auth_controller_1.createDemoSession);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map