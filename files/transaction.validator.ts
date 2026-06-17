import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared line item schema
// ---------------------------------------------------------------------------
const TransactionLineSchema = z.object({
  productId: z.string().cuid({ message: "productId debe ser un CUID válido" }),
  cantidad: z
    .number()
    .int({ message: "cantidad debe ser un entero" })
    .positive({ message: "cantidad debe ser mayor a 0" }),
  precioAplicado: z
    .number()
    .positive({ message: "precioAplicado debe ser mayor a 0" }),
});

// ---------------------------------------------------------------------------
// POST /api/v1/transacciones/registrar
// ---------------------------------------------------------------------------
export const RegistrarTransaccionSchema = z
  .object({
    tipo: z.enum(["VENTA_DIRECTA", "CREDITO", "CONSIGNACION"], {
      errorMap: () => ({
        message: "tipo debe ser VENTA_DIRECTA, CREDITO o CONSIGNACION",
      }),
    }),
    customerId: z.string().cuid({ message: "customerId inválido" }),
    userId: z.string().cuid({ message: "userId inválido" }), // Vendedor
    total: z.number().nonnegative({ message: "total no puede ser negativo" }),
    items: z
      .array(TransactionLineSchema)
      .min(1, { message: "Se requiere al menos una línea de producto" }),
  });

export type RegistrarTransaccionDTO = z.infer<typeof RegistrarTransaccionSchema>;
