import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const configSchema = z.object({
  companyName: z.string().min(2),
  companyRfc: z.string().min(12).max(13),
  taxRegimen: z.string().min(3),
  posTimeout: z.number().int().min(60).max(3600),
});

export const getConfig = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let config = await prisma.systemConfig.findFirst();
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'default',
          companyName: 'Hexa Core Systems',
          companyRfc: 'XAXX010101000',
          taxRegimen: '601',
          posTimeout: 300,
        }
      });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = configSchema.parse(req.body);
    
    let config = await prisma.systemConfig.findFirst();
    if (config) {
      config = await prisma.systemConfig.update({
        where: { id: config.id },
        data
      });
    } else {
      config = await prisma.systemConfig.create({
        data: { ...data, id: 'default' }
      });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};
