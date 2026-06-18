import { z } from 'zod';
export declare const TraspasoSchema: z.ZodEffects<z.ZodObject<{
    itemId: z.ZodString;
    cantidad: z.ZodNumber;
    locationOrigenId: z.ZodString;
    locationDestinoId: z.ZodString;
    userId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    cantidad: number;
    locationOrigenId: string;
    locationDestinoId: string;
    userId: string;
    notes?: string | undefined;
}, {
    itemId: string;
    cantidad: number;
    locationOrigenId: string;
    locationDestinoId: string;
    userId: string;
    notes?: string | undefined;
}>, {
    itemId: string;
    cantidad: number;
    locationOrigenId: string;
    locationDestinoId: string;
    userId: string;
    notes?: string | undefined;
}, {
    itemId: string;
    cantidad: number;
    locationOrigenId: string;
    locationDestinoId: string;
    userId: string;
    notes?: string | undefined;
}>;
export type TraspasoDTO = z.infer<typeof TraspasoSchema>;
//# sourceMappingURL=inventory.validator.d.ts.map