// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/sales-order.controller.ts
// Lógica para Pedidos de Venta y Cotizaciones
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class SalesOrderController {
  // POST /api/v1/sales-orders
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, userId, items, status = 'COTIZACION' } = req.body;

      if (!customerId || !userId || !items || !Array.isArray(items)) {
        res.status(400).json({ error: 'Datos inválidos' }); return;
      }

      // Calculate total
      const total = items.reduce((acc: number, item: any) => {
        return acc + (Number(item.precioAplicado) * Number(item.cantidad));
      }, 0);

      const order = await prisma.salesOrder.create({
        data: {
          customerId,
          userId,
          status,
          total: new Prisma.Decimal(total),
          items: {
            create: items.map((i: any) => ({
              itemId: i.itemId,
              cantidad: i.cantidad,
              precioAplicado: new Prisma.Decimal(i.precioAplicado)
            }))
          }
        },
        include: {
          items: { include: { item: { select: { name: true, sku: true } } } },
          customer: { select: { companyName: true } }
        }
      });

      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/sales-orders
  static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;

      const orders = await prisma.salesOrder.findMany({
        where: status ? { status: String(status) } : undefined,
        include: { customer: { select: { companyName: true } } },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/sales-orders/:id/status
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body; // APROBADO, RECHAZADO, FACTURADO

      const order = await prisma.salesOrder.update({
        where: { id },
        data: { status }
      });

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  // =============================================================================
  // GET /api/v1/sales-orders/quote
  // Listas de Precios Dinámicas y Descuentos
  // =============================================================================
  static async quotePrices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, productIds } = req.body; // array of item IDs

      if (!customerId || !Array.isArray(productIds)) {
        res.status(400).json({ error: 'customerId y productIds requeridos' }); return;
      }

      // Fetch customer's active price list
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { priceList: { include: { items: true } } }
      });

      if (!customer) {
        res.status(404).json({ error: 'Cliente no encontrado' }); return;
      }

      // Fetch items base prices
      const items = await prisma.item.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, name: true }
      });

      const quotes = items.map(item => {
        let appliedPrice = item.price;
        let isDiscounted = false;

        if (customer.priceList?.isActive) {
          const customPrice = customer.priceList.items.find(i => i.itemId === item.id);
          if (customPrice) {
            appliedPrice = customPrice.price;
            isDiscounted = true;
          }
        }

        return {
          itemId: item.id,
          name: item.name,
          basePrice: item.price,
          appliedPrice,
          isDiscounted,
          priceListName: isDiscounted ? customer.priceList!.name : 'Precio Público'
        };
      });

      res.status(200).json({ success: true, data: quotes });
    } catch (error) {
      next(error);
    }
  }

  // =============================================================================
  // POST /api/v1/sales-orders/:id/dispatch
  // QA Forense: Descuenta stock transaccionalmente al aprobar un pedido B2B
  // =============================================================================
  static async dispatchOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { locationId, userId } = req.body;

      if (!locationId || !userId) {
        res.status(400).json({ error: 'locationId y userId son requeridos' }); return;
      }

      const order = await prisma.salesOrder.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) {
        res.status(404).json({ error: 'Orden no encontrada' }); return;
      }
      if (order.status !== 'APROBADO') {
        res.status(400).json({ error: 'La orden debe estar APROBADA para poder ser despachada' }); return;
      }

      // Check if already dispatched (you could add a dispatched flag to the model, for now we assume we just do it once)
      
      const result = await prisma.$transaction(async (tx) => {
        // Descontar inventario y registrar en Kardex
        for (const item of order.items) {
          // Descontar stock del almacén
          await tx.inventory.update({
            where: {
              locationId_itemId: {
                locationId,
                itemId: item.itemId
              }
            },
            data: { quantity: { decrement: item.cantidad } }
          });

          // Descontar stock global
          await tx.item.update({
            where: { id: item.itemId },
            data: { globalStock: { decrement: item.cantidad } }
          });

          // Registrar Kardex
          await tx.kardexMovement.create({
            data: {
              tipo: 'SALIDA_VENTA',
              cantidad: item.cantidad,
              locationDestinoId: null,
              locationOrigenId: locationId,
              itemId: item.itemId,
              userId: userId,
              referenceId: order.id,
              notes: `Despacho de Pedido B2B ${order.id}`
            }
          });
        }

        // Marcar la orden como despachada (usaremos status FACTURADO o similar, o simplemente lo retornamos)
        // Ideally we add a dispatched flag. For now let's just update the status to EN_TRANSITO or keep it APROBADO.
        return tx.salesOrder.update({
          where: { id },
          data: { status: 'ENTREGADO' } // Or another status if needed
        });
      });

      res.status(200).json({ success: true, data: result, message: 'Orden despachada y stock descontado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}
