import { z } from "zod";
export declare const RegistrarTransaccionSchema: z.ZodObject<{
    tipo: z.ZodEnum<["VENTA_DIRECTA", "CREDITO", "CONSIGNACION"]>;
    customerId: z.ZodString;
    userId: z.ZodString;
    locationId: z.ZodOptional<z.ZodString>;
    total: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        cantidad: z.ZodNumber;
        precioAplicado: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        cantidad: number;
        precioAplicado: number;
    }, {
        productId: string;
        cantidad: number;
        precioAplicado: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tipo: "VENTA_DIRECTA" | "CREDITO" | "CONSIGNACION";
    customerId: string;
    userId: string;
    total: number;
    items: {
        productId: string;
        cantidad: number;
        precioAplicado: number;
    }[];
    locationId?: string | undefined;
}, {
    tipo: "VENTA_DIRECTA" | "CREDITO" | "CONSIGNACION";
    customerId: string;
    userId: string;
    total: number;
    items: {
        productId: string;
        cantidad: number;
        precioAplicado: number;
    }[];
    locationId?: string | undefined;
}>;
export type RegistrarTransaccionDTO = z.infer<typeof RegistrarTransaccionSchema>;
//# sourceMappingURL=transaction.validator.d.ts.map