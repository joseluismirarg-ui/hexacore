"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/validators/purchase.validator.ts
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecibirMercanciaSchema = exports.CrearPurchaseOrderSchema = exports.PurchaseOrderItemSchema = void 0;
const zod_1 = require("zod");
const decimalString = (label) => zod_1.z
    .string({ required_error: `${label} es requerido` })
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, {
    message: `${label} debe ser un decimal positivo con máximo 4 decimales`,
});
exports.PurchaseOrderItemSchema = zod_1.z.object({
    itemId: zod_1.z.string().cuid({ message: 'itemId debe ser un CUID válido' }),
    cantidad: zod_1.z
        .number({ invalid_type_error: 'cantidad debe ser un número' })
        .int()
        .positive('cantidad debe ser mayor a 0'),
    costUnit: decimalString('costUnit'),
});
exports.CrearPurchaseOrderSchema = zod_1.z.object({
    supplierId: zod_1.z.string().cuid({ message: 'supplierId debe ser un CUID válido' }),
    items: zod_1.z
        .array(exports.PurchaseOrderItemSchema)
        .min(1, 'Se requiere al menos un ítem'),
    notes: zod_1.z.string().trim().max(500).optional(),
});
exports.RecibirMercanciaSchema = zod_1.z.object({
    // ID del usuario que registra la recepción (para Kardex)
    userId: zod_1.z.string().cuid({ message: 'userId debe ser un CUID válido' }),
    // Almacén destino donde entra la mercancía
    locationId: zod_1.z.string().cuid({ message: 'locationId debe ser un CUID válido' }),
    notes: zod_1.z.string().trim().max(500).optional(),
});
//# sourceMappingURL=purchase.validator.js.map