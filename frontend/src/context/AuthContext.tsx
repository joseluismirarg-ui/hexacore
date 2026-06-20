import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  session: Session | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  revertImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const checkImpersonation = () => {
      const imp = sessionStorage.getItem('impersonatedTenantId');
      setIsImpersonating(!!imp);
    };

    // 1. Obtener la sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Usuario',
          role: session.user.user_metadata?.role || 'USER',
          tenantId: sessionStorage.getItem('impersonatedTenantId') || session.user.user_metadata?.tenantId || 'default-tenant'
        });
      }
      checkImpersonation();
      setIsLoading(false);
    });

    // 2. Escuchar cambios en la autenticación (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Usuario',
          role: session.user.user_metadata?.role || 'USER',
          tenantId: sessionStorage.getItem('impersonatedTenantId') || session.user.user_metadata?.tenantId || 'default-tenant'
        });
      } else {
        setUser(null);
      }
      checkImpersonation();
      setIsLoading(false);
    });

    // Listen for storage events (if impersonation changed in another tab or programmatically)
    window.addEventListener('storage', checkImpersonation);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', checkImpersonation);
    };
  }, []);

  const logout = async () => {
    sessionStorage.removeItem('impersonatedTenantId');
    localStorage.removeItem('hexa_token');
    await supabase.auth.signOut();
  };

  const revertImpersonation = () => {
    sessionStorage.removeItem('impersonatedTenantId');
    localStorage.removeItem('hexa_token');
    window.location.href = '/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: session?.access_token || null,
        session,
        logout,
        isAuthenticated: !!session,
        isLoading,
        isImpersonating,
        revertImpersonation
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
