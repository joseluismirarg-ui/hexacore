import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Verificando credenciales...</div>;
  }

  // Verificar que esté autenticado y que sea estrictamente SUPERADMIN
  if (!user || user.role !== 'SUPERADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
