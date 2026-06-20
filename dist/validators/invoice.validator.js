"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/validators/invoice.validator.ts
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimbrarFacturaSchema = void 0;
const zod_1 = require("zod");
// Regex RFC México: personas morales (12 chars) y físicas (13 chars)
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
// Catálogo de usos CFDI 4.0 más comunes
const USOS_CFDI = [
    'G01', // Adquisición de mercancias
    'G03', // Gastos en general
    'I01', // Construcciones
    'D01', // Honorarios médicos, dentales y gastos hospitalarios
    'P01', // Por definir
    'S01', // Sin efectos fiscales
];
exports.TimbrarFacturaSchema = zod_1.z.object({
    transactionId: zod_1.z.string().cuid({ message: 'transactionId debe ser un CUID válido' }),
    customerId: zod_1.z.string().cuid({ message: 'customerId debe ser un CUID válido' }),
    rfc_receptor: zod_1.z
        .string({ required_error: 'rfc_receptor es requerido' })
        .trim()
        .toUpperCase()
        .regex(RFC_REGEX, {
        message: 'RFC inválido. Formato esperado: XAXX010101000 (persona física) o AAA010101AAA (persona moral)',
    }),
    regimen_fiscal: zod_1.z
        .string({ required_error: 'regimen_fiscal es requerido' })
        .regex(/^\d{3}$/, { message: 'regimen_fiscal debe ser un código de 3 dígitos (Ej: 601)' }),
    uso_cfdi: zod_1.z.enum(USOS_CFDI, {
        errorMap: () => ({ message: 'uso_cfdi no es válido' }),
    }),
    forma_pago: zod_1.z.string().optional().default("99"),
    metodo_pago: zod_1.z.string().optional().default("PPD"),
});
//# sourceMappingURL=invoice.validator.js.map