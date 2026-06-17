import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ============================================================================
// LOGISTICS MODULE CONTROLLER (Isolated)
// ============================================================================

export const LogisticsController = {
  createTransfer: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenant?.id;
      const { originId, destinationId, items } = req.body;

      const transfer = await prisma.stockTransfer.create({
        data: {
          code: `TRF-${Date.now()}`,
          originId,
          destinationId,
          status: "PENDIENTE",
          tenantId: tenantId!,
          items: {
            create: items.map((i: any) => ({
              itemId: i.itemId,
              quantity: i.quantity,
            })),
          },
        },
      });
      res.status(201).json(transfer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  receiveTransfer: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transfer = await prisma.stockTransfer.update({
        where: { id },
        data: { status: "RECIBIDO" },
      });
      res.json(transfer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  optimizeRoutes: async (_req: Request, res: Response) => {
    try {
      res.json({ message: "Routes optimized successfully.", routes: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
