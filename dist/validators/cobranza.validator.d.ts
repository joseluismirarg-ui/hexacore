import { z } from "zod";
export declare const AbonarDeudaSchema: z.ZodObject<{
    customerId: z.ZodString;
    userId: z.ZodString;
    monto: z.ZodNumber;
    notas: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    userId: string;
    monto: number;
    notas?: string | undefined;
}, {
    customerId: string;
    userId: string;
    monto: number;
    notas?: string | undefined;
}>;
export type AbonarDeudaDTO = z.infer<typeof AbonarDeudaSchema>;
//# sourceMappingURL=cobranza.validator.d.ts.map