import { z } from "zod";
export declare const RegistrarTransaccionSchema: z.ZodObject<{
    tipo: z.ZodEnum<["VENTA_DIRECTA", "CREDITO", "CONSIGNACION"]>;
    customerId: z.ZodString;
    userId: z.ZodString;
    locationId: z.ZodOptional<z.ZodString>;
    forceSale: z.ZodOptional<z.ZodBoolean>;
    total: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        cantidad: z.ZodNumber;
        precioAplicado: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        cantidad: number;
        precioAplicado: number;
    }, {
        itemId: string;
        cantidad: number;
        precioAplicado: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        itemId: string;
        cantidad: number;
        precioAplicado: number;
    }[];
    tipo: "VENTA_DIRECTA" | "CREDITO" | "CONSIGNACION";
    customerId: string;
    userId: string;
    total: number;
    locationId?: string | undefined;
    forceSale?: boolean | undefined;
}, {
    items: {
        itemId: string;
        cantidad: number;
        precioAplicado: number;
    }[];
    tipo: "VENTA_DIRECTA" | "CREDITO" | "CONSIGNACION";
    customerId: string;
    userId: string;
    total: number;
    locationId?: string | undefined;
    forceSale?: boolean | undefined;
}>;
export type RegistrarTransaccionDTO = z.infer<typeof RegistrarTransaccionSchema>;
//# sourceMappingURL=transaction.validator.d.ts.map