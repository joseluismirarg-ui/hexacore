// =============================================================================
// HEXA CORE SYSTEMS — src/global.d.ts
// Augmentación del tipo Request de Express para incluir propiedades custom
// inyectadas por middlewares globales.
// =============================================================================

declare namespace Express {
  export interface Request {
    /**
     * Header de idempotencia extraído por el middleware global.
     * Presente si el cliente envió "Idempotency-Key" o "idempotency-key".
     * Debe ser un UUID v4 válido (formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).
     */
    idempotencyKey?: string;
    
    /**
     * Payload del token JWT decodificado por el middleware auth.
     */
    user?: {
      id: string;
      role: string;
      tenantId?: string;
    };
  }
}
