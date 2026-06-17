import { z } from "zod";

// ---------------------------------------------------------------------------
// POST /api/v1/cobranza/abonar
// ---------------------------------------------------------------------------
export const AbonarDeudaSchema = z.object({
  customerId: z.string().cuid({ message: "customerId inválido" }),
  userId: z.string().cuid({ message: "userId inválido" }),
  monto: z.number().positive({ message: "El monto debe ser mayor a 0" }),
  notas: z.string().max(500).optional(),
});

export type AbonarDeudaDTO = z.infer<typeof AbonarDeudaSchema>;
