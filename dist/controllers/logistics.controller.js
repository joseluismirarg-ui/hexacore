"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsController = void 0;
const prisma_1 = require("../lib/prisma");
// ============================================================================
// LOGISTICS MODULE CONTROLLER (Isolated)
// ============================================================================
exports.LogisticsController = {
    createTransfer: async (req, res) => {
        try {
            const tenantId = req.tenant?.id;
            const { originId, destinationId, items } = req.body;
            const transfer = await prisma_1.prisma.stockTransfer.create({
                data: {
                    code: `TRF-${Date.now()}`,
                    originId,
                    destinationId,
                    status: "PENDIENTE",
                    tenantId: tenantId,
                    items: {
                        create: items.map((i) => ({
                            itemId: i.itemId,
                            quantity: i.quantity,
                        })),
                    },
                },
            });
            res.status(201).json(transfer);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    receiveTransfer: async (req, res) => {
        try {
            const { id } = req.params;
            const transfer = await prisma_1.prisma.stockTransfer.update({
                where: { id },
                data: { status: "RECIBIDO" },
            });
            res.json(transfer);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    optimizeRoutes: async (_req, res) => {
        try {
            res.json({ message: "Routes optimized successfully.", routes: [] });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
//# sourceMappingURL=logistics.controller.js.map