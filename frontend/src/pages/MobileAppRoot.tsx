import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PuntoDeVenta } from './PuntoDeVenta';
import DriverTMS from './DriverTMS';

export default function MobileAppRoot() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center animate-pulse text-white">Cargando Sistema...</div>;

  // Segmentación Estricta
  if (user?.role === 'CHOFER') {
    return <DriverTMS />;
  }

  // Asumimos que PuntoDeVenta es responsivo o tiene su version movil
  if (user?.role === 'VENDEDOR' || user?.role === 'ADMIN') {
    return <PuntoDeVenta />;
  }

  return <div className="p-8 text-center text-red-500">Rol no autorizado para interfaz móvil.</div>;
}
