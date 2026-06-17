import React, { useState } from 'react';
import { useTenantConfig } from '@/lib/hooks';
import { Shield, Zap, Building2 } from 'lucide-react';

export default function PasarelaSuscripcion() {
  const { data: tenant, loading } = useTenantConfig();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleCheckout = async (plan: string) => {
    setProcessing(plan);
    // Simulación de Stripe Checkout Redirect
    setTimeout(() => {
      alert(`Redirigiendo a Stripe para el plan ${plan}...`);
      setProcessing(null);
      // En prod: window.location.href = session.url;
    }, 1500);
  };

  if (loading) return <div className="h-screen bg-hc-bg text-white flex items-center justify-center">Validando licencia...</div>;

  // Si el tenant está activo, podría ver esta pantalla para hacer un upgrade, o simplemente no verla.
  const isSuspended = tenant?.status === 'SUSPENDED' || tenant?.status === 'PAST_DUE';

  return (
    <div className="min-h-screen bg-hc-bg flex flex-col items-center justify-center p-4">
      {isSuspended && (
        <div className="bg-red-500/20 text-red-400 border border-red-500/50 p-4 rounded-lg mb-8 max-w-2xl w-full text-center font-bold">
          Tu cuenta se encuentra actualmente en estado {tenant.status}. Para continuar operando, por favor selecciona un plan.
        </div>
      )}
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Elige tu Plan de Crecimiento</h1>
        <p className="text-gray-400">Escala tu negocio sin límites con Hexa Core Global</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* BASIC */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col items-center relative overflow-hidden">
          <Shield className="h-12 w-12 text-blue-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Básico</h2>
          <p className="text-4xl font-black text-white mb-6">$49<span className="text-lg font-normal text-gray-500">/mes</span></p>
          <ul className="text-gray-400 space-y-3 mb-8 w-full">
            <li>✓ Hasta 2 usuarios</li>
            <li>✓ Módulo de Ventas Básico</li>
            <li>✓ Inventario Simple</li>
          </ul>
          <button 
            disabled={processing !== null}
            onClick={() => handleCheckout('BASIC')}
            className="mt-auto w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            {processing === 'BASIC' ? 'Procesando...' : 'Seleccionar Básico'}
          </button>
        </div>

        {/* PRO */}
        <div className="bg-gradient-to-b from-blue-900 to-gray-800 rounded-2xl p-8 border-2 border-blue-500 flex flex-col items-center relative transform md:-translate-y-4 shadow-2xl">
          <div className="absolute top-0 left-0 w-full bg-blue-500 text-white text-center text-xs font-bold py-1 uppercase tracking-wider">
            Recomendado
          </div>
          <Zap className="h-12 w-12 text-yellow-400 mb-4 mt-2" />
          <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
          <p className="text-4xl font-black text-white mb-6">$129<span className="text-lg font-normal text-gray-400">/mes</span></p>
          <ul className="text-gray-300 space-y-3 mb-8 w-full">
            <li>✓ Usuarios Ilimitados</li>
            <li>✓ Inteligencia Predictiva (Stock)</li>
            <li>✓ Módulo de Producción</li>
            <li>✓ Facturación CFDI 4.0</li>
          </ul>
          <button 
            disabled={processing !== null}
            onClick={() => handleCheckout('PRO')}
            className="mt-auto w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-all"
          >
            {processing === 'PRO' ? 'Procesando...' : 'Comenzar Prueba Pro'}
          </button>
        </div>

        {/* ENTERPRISE */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col items-center">
          <Building2 className="h-12 w-12 text-purple-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Enterprise</h2>
          <p className="text-4xl font-black text-white mb-6">$399<span className="text-lg font-normal text-gray-500">/mes</span></p>
          <ul className="text-gray-400 space-y-3 mb-8 w-full">
            <li>✓ Todo lo de Pro</li>
            <li>✓ Múltiples Sucursales</li>
            <li>✓ APIs y Webhooks</li>
            <li>✓ Soporte 24/7 Dedicado</li>
          </ul>
          <button 
            disabled={processing !== null}
            onClick={() => handleCheckout('ENTERPRISE')}
            className="mt-auto w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            {processing === 'ENTERPRISE' ? 'Procesando...' : 'Contactar Ventas'}
          </button>
        </div>
      </div>
    </div>
  );
}
