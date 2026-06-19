import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Inyectar WebSocket globalmente para que el SDK de Supabase lo encuentre en Node 20
if (typeof global !== 'undefined' && !(global as any).WebSocket) {
  (global as any).WebSocket = WebSocket;
}

// Inicializar cliente de Supabase para el backend usando las variables de entorno disponibles
// Usamos fallbacks para evitar que la app explote en el arranque (502 Bad Gateway) si falta la variable
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'dummy';

const supabase = createClient(supabaseUrl, supabaseKey);

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Acceso denegado: Token requerido' });
    return;
  }

  try {
    // Validar token de forma segura contra la API de Supabase, 
    // lo cual soporta tanto el antiguo HS256 como el nuevo RS256 automáticamente.
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
