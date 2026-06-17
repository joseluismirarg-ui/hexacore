import { z } from 'zod';
export declare const PurchaseOrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    cantidad: z.ZodNumber;
    costUnit: z.ZodString;
}, "strip", z.ZodTypeAny, {
    productId: string;
    cantidad: number;
    costUnit: string;
}, {
    productId: string;
    cantidad: number;
    costUnit: string;
}>;
export declare const CrearPurchaseOrderSchema: z.ZodObject<{
    supplierId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        cantidad: z.ZodNumber;
        costUnit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        cantidad: number;
        costUnit: string;
    }, {
        productId: string;
        cantidad: number;
        costUnit: string;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        cantidad: number;
        costUnit: string;
    }[];
    supplierId: string;
    notes?: string | undefined;
}, {
    items: {
        productId: string;
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
    userId: string;
    locationId: string;
    notes?: string | undefined;
}, {
    userId: string;
    locationId: string;
    notes?: string | undefined;
}>;
export type CrearPurchaseOrderDTO = z.infer<typeof CrearPurchaseOrderSchema>;
export type RecibirMercanciaDTO = z.infer<typeof RecibirMercanciaSchema>;
//# sourceMappingURL=purchase.validator.d.ts.map