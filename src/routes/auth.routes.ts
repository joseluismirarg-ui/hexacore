import { Router, Request, Response, NextFunction } from 'express';
import { login, createDemoSession } from '../controllers/auth.controller';
import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

const router = Router();

// GET /api/auth/seed-test-pro — TEMPORARY ROUTE to create a pro test account
router.get('/seed-test-pro', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Hexa Core Pro Test',
        plan: 'PRO'
      }
    });

    const user = await prisma.user.upsert({
      where: { email: 'prueba1@prueba1.com' },
      update: {
        tenantId: tenant.id,
        role: 'ADMIN'
      },
      create: {
        id: randomUUID(),
        name: 'Administrador Pro',
        email: 'prueba1@prueba1.com',
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });

    res.json({ success: true, message: 'Cuenta PRO creada', email: user.email });
  } catch (error) {
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
