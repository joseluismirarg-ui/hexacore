import { z } from 'zod';
export declare const RegistrarPagoSchema: z.ZodObject<{
    customerId: z.ZodString;
    amount: z.ZodString;
    method: z.ZodEnum<["TRANSFERENCIA", "EFECTIVO", "CHEQUE", "TARJETA"]>;
    transactionId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    amount: string;
    method: "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE" | "TARJETA";
    transactionId?: string | undefined;
    notes?: string | undefined;
}, {
    customerId: string;
    amount: string;
    method: "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE" | "TARJETA";
    transactionId?: string | undefined;
    notes?: string | undefined;
}>;
export type RegistrarPagoDTO = z.infer<typeof RegistrarPagoSchema>;
//# sourceMappingURL=payment.validator.d.ts.map