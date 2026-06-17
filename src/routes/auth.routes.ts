import { Router } from 'express';
import { login, createDemoSession } from '../controllers/auth.controller';

const router = Router();

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
router.post('/login', login);

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
router.post('/demo', createDemoSession);

export default router;
