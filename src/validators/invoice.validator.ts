// =============================================================================
// HEXA CORE SYSTEMS — src/validators/invoice.validator.ts
// =============================================================================

import { z } from 'zod';

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
] as const;

export const TimbrarFacturaSchema = z.object({
  transactionId: z.string().cuid({ message: 'transactionId debe ser un CUID válido' }),
  customerId: z.string().cuid({ message: 'customerId debe ser un CUID válido' }),
  rfc_receptor: z
    .string({ required_error: 'rfc_receptor es requerido' })
    .trim()
    .toUpperCase()
    .regex(RFC_REGEX, {
      message: 'RFC inválido. Formato esperado: XAXX010101000 (persona física) o AAA010101AAA (persona moral)',
    }),
  regimen_fiscal: z
    .string({ required_error: 'regimen_fiscal es requerido' })
    .regex(/^\d{3}$/, { message: 'regimen_fiscal debe ser un código de 3 dígitos (Ej: 601)' }),
  uso_cfdi: z.enum(USOS_CFDI, {
    errorMap: () => ({ message: 'uso_cfdi no es válido' }),
  }),
  forma_pago: z.string().optional().default("99"),
  metodo_pago: z.string().optional().default("PPD"),
});

export type TimbrarFacturaDTO = z.infer<typeof TimbrarFacturaSchema>;
