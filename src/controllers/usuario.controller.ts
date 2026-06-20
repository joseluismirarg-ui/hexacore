import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

export const getVendedores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const vendedores = await prisma.user.findMany({
      where: tenantId ? { role: 'VENDEDOR', tenantId } : { role: 'VENDEDOR' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    res.json({ success: true, data: vendedores });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const users = await prisma.user.findMany({
      where: tenantId ? { tenantId } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, role } = req.body;
    const tenantId = (req as any).user?.tenantId;

    const user = await prisma.user.create({
      data: { id: randomUUID(), email, name, role, tenantId },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;
    
    const data: any = { name, email, role, isActive };
    // password is handled by supabase

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
