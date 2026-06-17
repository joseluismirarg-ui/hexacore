// =============================================================================
// HEXA CORE SYSTEMS — src/validators/inventory.validator.ts
// =============================================================================

import { z } from 'zod';

export const TraspasoSchema = z.object({
  itemId: z.string().cuid({ message: 'itemId debe ser un CUID válido' }),
  cantidad: z
    .number({ invalid_type_error: 'cantidad debe ser un número' })
    .int()
    .positive('cantidad debe ser mayor a 0'),
  locationOrigenId: z.string().cuid({ message: 'locationOrigenId debe ser un CUID válido' }),
  locationDestinoId: z.string().cuid({ message: 'locationDestinoId debe ser un CUID válido' }),
  userId: z.string().cuid({ message: 'userId debe ser un CUID válido' }),
  notes: z.string().trim().max(500).optional(),
}).refine((data) => data.locationOrigenId !== data.locationDestinoId, {
  message: 'El almacén origen y destino deben ser diferentes',
  path: ['locationDestinoId'],
});

export type TraspasoDTO = z.infer<typeof TraspasoSchema>;
