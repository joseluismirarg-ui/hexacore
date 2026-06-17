import { z } from 'zod';
export declare const TraspasoSchema: z.ZodEffects<z.ZodObject<{
    productId: z.ZodString;
    cantidad: z.ZodNumber;
    locationOrigenId: z.ZodString;
    locationDestinoId: z.ZodString;
    userId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    cantidad: number;
    userId: string;
    locationOrigenId: string;
    locationDestinoId: string;
    notes?: string | undefined;
}, {
    productId: string;
    cantidad: number;
    userId: string;
    locationOrigenId: string;
    locationDestinoId: string;
    notes?: string | undefined;
}>, {
    productId: string;
    cantidad: number;
    userId: string;
    locationOrigenId: string;
    locationDestinoId: string;
    notes?: string | undefined;
}, {
    productId: string;
    cantidad: number;
    userId: string;
    locationOrigenId: string;
    locationDestinoId: string;
    notes?: string | undefined;
}>;
export type TraspasoDTO = z.infer<typeof TraspasoSchema>;
//# sourceMappingURL=inventory.validator.d.ts.map