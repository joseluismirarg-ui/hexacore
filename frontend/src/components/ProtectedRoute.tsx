import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hc-bg">
        <Loader2 className="h-8 w-8 animate-spin text-hc-cobalt-light" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login guardando la ruta intentada
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
