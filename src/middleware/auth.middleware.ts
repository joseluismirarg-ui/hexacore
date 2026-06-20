import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Inyectar WebSocket globalmente para que el SDK de Supabase lo encuentre en Node 20
if (typeof global !== 'undefined' && !(global as any).WebSocket) {
  (global as any).WebSocket = WebSocket;
}

console.log('[DEBUG] Backend Env Vars:', {
  hasViteUrl: !!process.env.VITE_SUPABASE_URL,
  hasSupaUrl: !!process.env.SUPABASE_URL,
  viteUrlLen: process.env.VITE_SUPABASE_URL?.length,
  supaUrlLen: process.env.SUPABASE_URL?.length,
  hasJwtSecret: !!process.env.SUPABASE_JWT_SECRET
});

// Inicializar cliente de Supabase para el backend usando las mismas credenciales hardcodeadas del frontend
// Esto evita errores 403 si las variables de Railway tienen errores de tipeo.
const supabaseUrl = 'https://xlqdteghltctdorrpfdo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscWR0ZWdobHRjdGRvcnJwZmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTcwNDQsImV4cCI6MjA5NzM5MzA0NH0.IkHt8Kp2n12ctqlG74Azu4iHY08pWzcYbYeG0NZz1no';

const supabase = createClient(supabaseUrl, supabaseKey);

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Acceso denegado: Token requerido' });
    return;
  }

  try {
    // 1. Intentar decodificar como JWT local (para impersonación de SuperAdmin)
    try {
      const decodedLocal = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
      if (decodedLocal && decodedLocal.impersonated) {
         req.user = { id: decodedLocal.userId, role: decodedLocal.role, tenantId: decodedLocal.tenantId };
         return next();
      }
    } catch (e) {
      // No es un token local válido (o no es de impersonación), continuamos con Supabase Auth
    }

    // 2. Validar token de forma segura contra la API de Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase Auth Error:', error?.message);
      res.status(403).json({ success: false, message: 'Token inválido o expirado' });
      return;
    }
    
    // Extraer rol y tenantId de los metadatos de Supabase
    const role = user.user_metadata?.role || 'USER';
    const tenantId = user.user_metadata?.tenantId || 'default-tenant';

    req.user = { 
      id: user.id,
      role: role, 
      tenantId: tenantId 
    };
    
    next();
  } catch (error) {
    console.error('Auth Exception:', error);
    res.status(403).json({ success: false, message: 'Excepción de seguridad en token' });
    return;
  }
};
