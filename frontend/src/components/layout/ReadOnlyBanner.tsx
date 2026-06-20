import { useTenantStore } from '@/store/useTenantStore';
import { AlertTriangle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReadOnlyBanner() {
  const { isReadOnly, isSuspended } = useTenantStore();

  if (isSuspended) {
    return (
      <div className="bg-red-600 px-4 py-3 text-white flex items-center justify-between shadow-md relative z-50">
        <div className="flex items-center space-x-3">
          <Lock className="w-5 h-5 text-white animate-pulse" />
          <p className="text-sm font-medium">
            <strong>Cuenta Suspendida:</strong> Su servicio ha sido interrumpido por falta de pago prolongada. Contacte a soporte inmediatamente.
          </p>
        </div>
        <Link 
          to="/settings/billing" 
          className="px-4 py-1.5 bg-white text-red-700 text-xs font-bold rounded hover:bg-red-50 transition-colors shadow-sm"
        >
          Regularizar Cuenta
        </Link>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div className="bg-amber-500 px-4 py-3 text-white flex items-center justify-between shadow-md relative z-50">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-100" />
          <p className="text-sm font-medium text-amber-50">
            <strong className="text-white">Modo de Solo Lectura Activo:</strong> Su cuenta presenta un adeudo. No se permiten registrar ventas ni despachar camiones.
          </p>
        </div>
        <Link 
          to="/settings/billing" 
          className="px-4 py-1.5 bg-amber-700 text-white text-xs font-bold rounded hover:bg-amber-800 transition-colors shadow-sm"
        >
          Regularizar Pago Aquí
        </Link>
      </div>
    );
  }

  return null;
}
