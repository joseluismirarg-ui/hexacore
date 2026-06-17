// =============================================================================
// HEXA CORE SYSTEMS — src/validators/purchase.validator.ts
// =============================================================================

import { z } from 'zod';

const decimalString = (label: string) =>
  z
    .string({ required_error: `${label} es requerido` })
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, {
      message: `${label} debe ser un decimal positivo con máximo 4 decimales`,
    });

export const PurchaseOrderItemSchema = z.object({
  itemId: z.string().cuid({ message: 'itemId debe ser un CUID válido' }),
  cantidad: z
    .number({ invalid_type_error: 'cantidad debe ser un número' })
    .int()
    .positive('cantidad debe ser mayor a 0'),
  costUnit: decimalString('costUnit'),
});

export const CrearPurchaseOrderSchema = z.object({
  supplierId: z.string().cuid({ message: 'supplierId debe ser un CUID válido' }),
  items: z
    .array(PurchaseOrderItemSchema)
    .min(1, 'Se requiere al menos un ítem'),
  notes: z.string().trim().max(500).optional(),
});

export const RecibirMercanciaSchema = z.object({
  // ID del usuario que registra la recepción (para Kardex)
  userId: z.string().cuid({ message: 'userId debe ser un CUID válido' }),
  // Almacén destino donde entra la mercancía
  locationId: z.string().cuid({ message: 'locationId debe ser un CUID válido' }),
  notes: z.string().trim().max(500).optional(),
});

export type CrearPurchaseOrderDTO = z.infer<typeof CrearPurchaseOrderSchema>;
export type RecibirMercanciaDTO = z.infer<typeof RecibirMercanciaSchema>;
