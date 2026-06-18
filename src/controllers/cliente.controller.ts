import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

import { z } from 'zod';

const customerSchema = z.object({
  companyName: z.string().min(2),
  rfc: z.string().min(12).max(13).optional().or(z.literal('').transform(() => undefined)),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().optional().or(z.literal('').transform(() => undefined)),
  creditLimit: z.number().or(z.string()).transform(val => Number(val)).optional().default(0),
});

export const getClientes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { companyName: 'asc' }
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({
      data: {
        ...data,
        currentDebt: 0
      }
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const getClientesConsignacion = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        inventoryLocations: {
          some: { tipo: 'CONSIGNACION_CLIENTE' }
        }
      },
      include: {
        inventoryLocations: {
          where: { tipo: 'CONSIGNACION_CLIENTE' },
          include: {
            inventoryStocks: {
              include: { item: true }
            }
          }
        }
      }
    });

    const data = customers.map(customer => {
      const creditLimit = customer.creditLimit.toNumber();
      const currentDebt = customer.currentDebt.toNumber();
      const porcentajeUtilizado = creditLimit > 0 ? (currentDebt / creditLimit) * 100 : 0;
      
      let estado = 'al_corriente';
      if (porcentajeUtilizado > 90) estado = 'bloqueado';
      else if (porcentajeUtilizado > 70) estado = 'proximo_vencer';

      const skusConsignados = customer.inventoryLocations.flatMap(loc => 
        loc.inventoryStocks.map(stock => ({
          item: stock.item,
          cantidad: stock.quantity
        }))
      );

      return {
        customer: {
          id: customer.id,
          companyName: customer.companyName,
          creditLimit: creditLimit,
          currentDebt: currentDebt,
        },
        skusConsignados,
        estado,
        porcentajeUtilizado
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
