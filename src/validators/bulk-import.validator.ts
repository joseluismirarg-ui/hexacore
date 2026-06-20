import { z } from 'zod';

// ============================================================================
// Funciones de Pre-procesamiento y Limpieza (Sanitization)
// ============================================================================

/**
 * Limpia una cadena numérica que puede contener formato de moneda ($),
 * comas de miles (,), espacios, o códigos de divisa (MXN, USD).
 * Retorna el número flotante puro, o NaN si es inválido.
 */
const parseFinancialNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return NaN;
  
  // Remover $, MXN, USD, espacios y comas. Mantiene puntos decimales y signos negativos.
  const cleanStr = val.replace(/[$\s,A-Za-z]/g, '');
  return parseFloat(cleanStr);
};

/**
 * Limpia un string de caracteres invisibles, saltos de línea al inicio/fin
 * y espacios adicionales redundantes.
 */
const cleanString = (val: unknown): string | undefined => {
  if (typeof val !== 'string') return undefined;
  return val.trim().replace(/\s{2,}/g, ' '); // Reduce múltiples espacios a uno solo
};

// ============================================================================
// Schemas de Validación
// ============================================================================

export const ItemImportSchema = z.object({
  sku: z.preprocess(cleanString, z.string().min(1, 'El SKU es obligatorio').max(100)),
  name: z.preprocess(cleanString, z.string().min(1, 'El nombre es obligatorio').max(255)),
  description: z.preprocess(cleanString, z.string().optional()),
  
  // Campos financieros sanitizados dinámicamente
  cost: z.preprocess(parseFinancialNumber, z.number({ invalid_type_error: 'Costo inválido' }).nonnegative('El costo no puede ser negativo')),
  price: z.preprocess(parseFinancialNumber, z.number({ invalid_type_error: 'Precio inválido' }).nonnegative('El precio no puede ser negativo')),
  
  // Inventario actual y puntos de reorden (opcionales para el import)
  stock_actual: z.preprocess((val) => typeof val === 'string' ? parseInt(val.replace(/[,\s]/g, ''), 10) : val, z.number().int().optional().default(0)),
  reorder_point: z.preprocess((val) => typeof val === 'string' ? parseInt(val.replace(/[,\s]/g, ''), 10) : val, z.number().int().optional().default(10)),
  
  // Relaciones (Fallback wildcard si no existen)
  category_id: z.preprocess(cleanString, z.string().optional()),
});

export const CustomerImportSchema = z.object({
  company_name: z.preprocess(cleanString, z.string().min(1, 'El nombre del cliente es obligatorio').max(255)),
  rfc: z.preprocess(cleanString, z.string().optional()),
  email: z.preprocess(cleanString, z.string().email('Formato de correo inválido').optional().or(z.literal(''))),
  phone: z.preprocess(cleanString, z.string().optional()),
  
  credit_limit: z.preprocess(parseFinancialNumber, z.number().nonnegative().optional().default(0)),
  credit_days: z.preprocess((val) => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().nonnegative().optional().default(0)),
  
  price_list_id: z.preprocess(cleanString, z.string().optional()),
});

// Tipos inferidos
export type ItemImportDTO = z.infer<typeof ItemImportSchema>;
export type CustomerImportDTO = z.infer<typeof CustomerImportSchema>;
