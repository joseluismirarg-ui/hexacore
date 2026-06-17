// =============================================================================
// HEXA CORE SYSTEMS — src/validators/payment.validator.ts
// =============================================================================

import { z } from 'zod';

const decimalString = (label: string) =>
  z
    .string({ required_error: `${label} es requerido` })
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, {
      message: `${label} debe ser un decimal positivo con máximo 2 decimales`,
    });

export const RegistrarPagoSchema = z.object({
  customerId: z.string().cuid({ message: 'customerId debe ser un CUID válido' }),
  amount: decimalString('amount'),
  method: z.enum(['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'TARJETA'], {
    errorMap: () => ({ message: 'method debe ser TRANSFERENCIA, EFECTIVO, CHEQUE o TARJETA' }),
  }),
  transactionId: z
    .string()
    .cuid({ message: 'transactionId debe ser un CUID válido' })
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

export type RegistrarPagoDTO = z.infer<typeof RegistrarPagoSchema>;
