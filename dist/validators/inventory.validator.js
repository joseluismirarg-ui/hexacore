"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/validators/inventory.validator.ts
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraspasoSchema = void 0;
const zod_1 = require("zod");
exports.TraspasoSchema = zod_1.z.object({
    productId: zod_1.z.string().cuid({ message: 'productId debe ser un CUID válido' }),
    cantidad: zod_1.z
        .number({ invalid_type_error: 'cantidad debe ser un número' })
        .int()
        .positive('cantidad debe ser mayor a 0'),
    locationOrigenId: zod_1.z.string().cuid({ message: 'locationOrigenId debe ser un CUID válido' }),
    locationDestinoId: zod_1.z.string().cuid({ message: 'locationDestinoId debe ser un CUID válido' }),
    userId: zod_1.z.string().cuid({ message: 'userId debe ser un CUID válido' }),
    notes: zod_1.z.string().trim().max(500).optional(),
}).refine((data) => data.locationOrigenId !== data.locationDestinoId, {
    message: 'El almacén origen y destino deben ser diferentes',
    path: ['locationDestinoId'],
});
//# sourceMappingURL=inventory.validator.js.map