import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Acceso denegado: Token requerido' });
    return;
  }

  try {
    // Supabase firma sus JWT con el JWT Secret del proyecto
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'fallback_secret') as any;
    
    // Extraer rol y tenantId de los metadatos de Supabase
    const role = decoded.user_metadata?.role || 'USER';
    const tenantId = decoded.user_metadata?.tenantId || 'default-tenant';

    req.user = { 
      id: decoded.sub, // 'sub' es el ID de usuario en Supabase
      role: role, 
      tenantId: tenantId 
    };
    
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    return;
  }
};
