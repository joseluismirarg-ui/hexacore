// =============================================================================
// HEXA CORE SYSTEMS — src/validators/product.validator.ts
// =============================================================================

import { z } from 'zod';

// Regex para validar strings numéricos de Decimal (ej. "1234.5678")
const decimalString = (label: string) =>
  z
    .string({ required_error: `${label} es requerido` })
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, {
      message: `${label} debe ser un número decimal positivo con máximo 4 decimales (ej. "99.9900")`,
    });

export const CrearProductoSchema = z.object({
  sku: z
    .string({ required_error: 'sku es requerido' })
    .trim()
    .min(2, 'sku debe tener al menos 2 caracteres')
    .max(50, 'sku no puede exceder 50 caracteres')
    .toUpperCase(),
  name: z
    .string({ required_error: 'name es requerido' })
    .trim()
    .min(2, 'name debe tener al menos 2 caracteres')
    .max(200),
  description: z.string().trim().max(500).optional(),
  cost: decimalString('cost'),
  price: decimalString('price'),
});

export const ActualizarProductoSchema = CrearProductoSchema.partial();

export type CrearProductoDTO = z.infer<typeof CrearProductoSchema>;
export type ActualizarProductoDTO = z.infer<typeof ActualizarProductoSchema>;
