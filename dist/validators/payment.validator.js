"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/validators/payment.validator.ts
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrarPagoSchema = void 0;
const zod_1 = require("zod");
const decimalString = (label) => zod_1.z
    .string({ required_error: `${label} es requerido` })
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, {
    message: `${label} debe ser un decimal positivo con máximo 2 decimales`,
});
exports.RegistrarPagoSchema = zod_1.z.object({
    customerId: zod_1.z.string().cuid({ message: 'customerId debe ser un CUID válido' }),
    amount: decimalString('amount'),
    method: zod_1.z.enum(['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'TARJETA'], {
        errorMap: () => ({ message: 'method debe ser TRANSFERENCIA, EFECTIVO, CHEQUE o TARJETA' }),
    }),
    transactionId: zod_1.z
        .string()
        .cuid({ message: 'transactionId debe ser un CUID válido' })
        .optional(),
    notes: zod_1.z.string().trim().max(500).optional(),
});
//# sourceMappingURL=payment.validator.js.map