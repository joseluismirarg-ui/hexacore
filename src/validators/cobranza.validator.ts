// =============================================================================
// HEXA CORE SYSTEMS — src/validators/cobranza.validator.ts
// Esquema de validación para operaciones de cobranza y estado de cuenta.
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// POST /api/v1/cobranza/abonar
// ---------------------------------------------------------------------------
export const AbonarDeudaSchema = z.object({
  customerId: z.string().cuid({ message: "customerId debe ser un CUID válido" }),
  userId: z.string().cuid({ message: "userId debe ser un CUID válido" }),
  monto: z
    .number({
      required_error: "monto es requerido",
      invalid_type_error: "monto debe ser un número",
    })
    .positive({ message: "El monto debe ser mayor a 0" })
    .multipleOf(0.01, { message: "El monto puede tener máximo 2 decimales" }),
  notas: z
    .string({ invalid_type_error: "notas debe ser texto" })
    .max(500, { message: "notas no puede exceder 500 caracteres" })
    .optional(),
});

export type AbonarDeudaDTO = z.infer<typeof AbonarDeudaSchema>;
