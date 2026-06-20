import React, { useState } from 'react';
import { useTenantConfig } from '@/lib/hooks';
import { Shield, Zap, Building2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, subscriptionApi } from '@/lib/api';

export default function PasarelaSuscripcion() {
  const { data: tenant, loading } = useTenantConfig();
  const [processing, setProcessing] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleCheckout = async (plan: string) => {
    try {
      setProcessing(plan);
      const res = await subscriptionApi.createCheckoutSession({
        tier: plan,
        billingCycle,
        tenantId: tenant?.id
      });
      if (res.success && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert('Error al crear sesión de pago');
        setProcessing(null);
      }
    } catch (err: any) {
      alert(err.message || 'Error al conectar con Stripe');
      setProcessing(null);
    }
  };

  if (loading) return <div className="h-screen bg-hc-bg text-white flex items-center justify-center">Validando licencia...</div>;

  const isSuspended = tenant?.status === 'SUSPENDED' || tenant?.status === 'PAST_DUE';

  const pricing = {
    BASIC: { monthly: 999, annual: 999 * 11 },
    PRO: { monthly: 2899, annual: 2899 * 11 },
    ENTERPRISE: { monthly: 4999, annual: 4999 * 11 }
  };

  return (
    <div className="min-h-screen bg-hc-bg flex flex-col items-center justify-center p-4">
      {isSuspended && (
        <div className="bg-red-500/20 text-red-400 border border-red-500/50 p-4 rounded-lg mb-8 max-w-2xl w-full text-center font-bold">
          Tu cuenta se encuentra actualmente en estado {tenant.status}. Para continuar operando, por favor selecciona un plan.
        </div>
      )}
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Elige tu Plan de Crecimiento</h1>
        <p className="text-gray-400 mb-8">Escala tu negocio sin límites con Hexa Core Global</p>

        {/* Toggle Mensual / Anual */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>Mensual</span>
          <button
            onClick={() => setBillingCycle(b => b === 'monthly' ? 'annual' : 'monthly')}
            className="relative inline-flex h-7 w-14 items-center rounded-full bg-blue-600 transition-colors focus:outline-none"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium flex items-center gap-2 ${billingCycle === 'annual' ? 'text-white' : 'text-gray-400'}`}>
            Anual <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">1 Mes Gratis</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* BASIC */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col items-center relative overflow-hidden hover:border-gray-500 transition-colors">
          <Shield className="h-12 w-12 text-blue-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Básico</h2>
          <div className="flex flex-col items-center mb-6">
            <p className="text-4xl font-black text-white">
              {formatCurrency(billingCycle === 'monthly' ? pricing.BASIC.monthly : pricing.BASIC.annual)}
            </p>
            <span className="text-sm font-normal text-gray-500">MXN / {billingCycle === 'monthly' ? 'mes' : 'año'}</span>
          </div>
          <ul className="text-gray-400 space-y-3 mb-8 w-full text-sm">
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-blue-500 shrink-0"/> Hasta 2 usuarios</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-blue-500 shrink-0"/> Módulo de Ventas Básico</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-blue-500 shrink-0"/> Inventario Simple</li>
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
          <div className="flex flex-col items-center mb-6">
            <p className="text-4xl font-black text-white">
              {formatCurrency(billingCycle === 'monthly' ? pricing.PRO.monthly : pricing.PRO.annual)}
            </p>
            <span className="text-sm font-normal text-gray-400">MXN / {billingCycle === 'monthly' ? 'mes' : 'año'}</span>
          </div>
          <ul className="text-gray-300 space-y-3 mb-8 w-full text-sm">
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-blue-400 shrink-0"/> Usuarios Ilimitados</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-blue-400 shrink-0"/> Inteligencia Predictiva (Stock)</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-blue-400 shrink-0"/> Módulo de Producción</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-blue-400 shrink-0"/> Facturación CFDI 4.0</li>
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
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col items-center hover:border-gray-500 transition-colors">
          <Building2 className="h-12 w-12 text-purple-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Enterprise</h2>
          <div className="flex flex-col items-center mb-6">
            <p className="text-4xl font-black text-white">
              {formatCurrency(billingCycle === 'monthly' ? pricing.ENTERPRISE.monthly : pricing.ENTERPRISE.annual)}
            </p>
            <span className="text-sm font-normal text-gray-500">MXN / {billingCycle === 'monthly' ? 'mes' : 'año'}</span>
          </div>
          <ul className="text-gray-400 space-y-3 mb-8 w-full text-sm">
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-purple-400 shrink-0"/> Todo lo de Pro</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-purple-400 shrink-0"/> Múltiples Sucursales</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-purple-400 shrink-0"/> APIs y Webhooks</li>
            <li className="flex gap-2"><CheckCircle2 size={18} className="text-purple-400 shrink-0"/> Soporte 24/7 Dedicado</li>
          </ul>
          <button 
            disabled={processing !== null}
            onClick={() => handleCheckout('ENTERPRISE')}
            className="mt-auto w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            {processing === 'ENTERPRISE' ? 'Procesando...' : 'Seleccionar Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
}
