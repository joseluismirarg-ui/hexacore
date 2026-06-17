import { z } from 'zod';
export declare const CrearProductoSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    cost: z.ZodString;
    price: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    sku: string;
    cost: string;
    price: string;
    description?: string | undefined;
}, {
    name: string;
    sku: string;
    cost: string;
    price: string;
    description?: string | undefined;
}>;
export declare const ActualizarProductoSchema: z.ZodObject<{
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cost: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    sku?: string | undefined;
    description?: string | undefined;
    cost?: string | undefined;
    price?: string | undefined;
}, {
    name?: string | undefined;
    sku?: string | undefined;
    description?: string | undefined;
    cost?: string | undefined;
    price?: string | undefined;
}>;
export type CrearProductoDTO = z.infer<typeof CrearProductoSchema>;
export type ActualizarProductoDTO = z.infer<typeof ActualizarProductoSchema>;
//# sourceMappingURL=product.validator.d.ts.map