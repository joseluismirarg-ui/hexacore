import { z } from 'zod';
export declare const PurchaseOrderItemSchema: z.ZodObject<{
    itemId: z.ZodString;
    cantidad: z.ZodNumber;
    costUnit: z.ZodString;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    cantidad: number;
    costUnit: string;
}, {
    itemId: string;
    cantidad: number;
    costUnit: string;
}>;
export declare const CrearPurchaseOrderSchema: z.ZodObject<{
    supplierId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        cantidad: z.ZodNumber;
        costUnit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        cantidad: number;
        costUnit: string;
    }, {
        itemId: string;
        cantidad: number;
        costUnit: string;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        itemId: string;
        cantidad: number;
        costUnit: string;
    }[];
    supplierId: string;
    notes?: string | undefined;
}, {
    items: {
        itemId: string;
        cantidad: number;
        costUnit: string;
    }[];
    supplierId: string;
    notes?: string | undefined;
}>;
export declare const RecibirMercanciaSchema: z.ZodObject<{
    userId: z.ZodString;
    locationId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    locationId: string;
    userId: string;
    notes?: string | undefined;
}, {
    locationId: string;
    userId: string;
    notes?: string | undefined;
}>;
export type CrearPurchaseOrderDTO = z.infer<typeof CrearPurchaseOrderSchema>;
export type RecibirMercanciaDTO = z.infer<typeof RecibirMercanciaSchema>;
//# sourceMappingURL=purchase.validator.d.ts.map