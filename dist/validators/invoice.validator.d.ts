import { z } from 'zod';
export declare const TimbrarFacturaSchema: z.ZodObject<{
    transactionId: z.ZodString;
    customerId: z.ZodString;
    rfc_receptor: z.ZodString;
    regimen_fiscal: z.ZodString;
    uso_cfdi: z.ZodEnum<["G01", "G03", "I01", "D01", "P01", "S01"]>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    transactionId: string;
    rfc_receptor: string;
    regimen_fiscal: string;
    uso_cfdi: "G01" | "G03" | "I01" | "D01" | "P01" | "S01";
}, {
    customerId: string;
    transactionId: string;
    rfc_receptor: string;
    regimen_fiscal: string;
    uso_cfdi: "G01" | "G03" | "I01" | "D01" | "P01" | "S01";
}>;
export type TimbrarFacturaDTO = z.infer<typeof TimbrarFacturaSchema>;
//# sourceMappingURL=invoice.validator.d.ts.map