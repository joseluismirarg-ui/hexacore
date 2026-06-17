import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, CheckCircle2, PlayCircle, Shield, Zap, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

export function Landing() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemo = async () => {
    setIsDemoLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.token) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        alert(data.error || 'Error conectando al servidor.');
      }
    } catch (err) {
      alert('Error de red. Intenta más tarde.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hc-bg text-gray-100 overflow-x-hidden font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-hc-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-hc-cobalt to-hc-cobalt-dark shadow-lg shadow-hc-cobalt/20">
              <Hexagon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide">Hexa Core</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
            <Button variant="primary" loading={isDemoLoading} onClick={handleDemo}>Probar Demo</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-hc-cobalt/20 via-hc-bg to-hc-bg"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8">
            El ERP Definitivo para <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-cobalt to-hc-coral">Escalar tu Negocio</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10">
            Control de inventarios, POS predictivo, multitenancy y analítica forense en tiempo real. Configuración en segundos, no en meses.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="px-8 text-lg rounded-full" loading={isDemoLoading} onClick={handleDemo}>
              <PlayCircle className="mr-2 h-5 w-5" /> Probar Demo en Vivo
            </Button>
          </div>
        </div>
      </section>

      {/* Propuesta de Valor */}
      <section className="py-20 bg-hc-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="p-6 rounded-2xl bg-hc-surface-dark border border-gray-800">
              <Zap className="h-12 w-12 text-hc-cobalt mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Agnóstico al Giro</h3>
              <p className="text-gray-400">Nuestro Onboarding Wizard configura el sistema para Retail, Manufactura o Servicios al instante.</p>
            </div>
            <div className="p-6 rounded-2xl bg-hc-surface-dark border border-gray-800">
              <Shield className="h-12 w-12 text-hc-coral mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Multitenancy Blindado</h3>
              <p className="text-gray-400">Arquitectura SaaS que aísla tu base de datos y provee métricas globales sin riesgo de cruces.</p>
            </div>
            <div className="p-6 rounded-2xl bg-hc-surface-dark border border-gray-800">
              <Database className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Alertas Predictivas</h3>
              <p className="text-gray-400">Algoritmos inteligentes predicen tu agotamiento de inventario basado en velocidad de ventas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">Planes Flexibles para tu Crecimiento</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {['Básico', 'Pro', 'Enterprise'].map((plan, i) => (
              <div key={plan} className={`p-8 rounded-3xl border ${i === 1 ? 'border-hc-cobalt bg-hc-cobalt/5 relative scale-105' : 'border-gray-800 bg-hc-surface'} flex flex-col`}>
                {i === 1 && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-hc-cobalt text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">Más Popular</span>}
                <h3 className="text-2xl font-bold mb-4">{plan}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">${i === 0 ? '49' : i === 1 ? '99' : '299'}</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="h-5 w-5 text-hc-cobalt" /> Hasta {i === 0 ? '1,000' : i === 1 ? '10,000' : 'Ilimitados'} Items</li>
                  <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="h-5 w-5 text-hc-cobalt" /> {i === 0 ? '1' : i === 1 ? '5' : 'Ilimitadas'} Ubicaciones</li>
                  {i > 0 && <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="h-5 w-5 text-hc-cobalt" /> Alertas Predictivas AI</li>}
                  {i > 1 && <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="h-5 w-5 text-hc-cobalt" /> Soporte SLA 24/7</li>}
                </ul>
                <Button variant={i === 1 ? 'primary' : 'ghost'} fullWidth onClick={handleDemo}>
                  Empezar Prueba Gratis
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800 text-center text-gray-500">
        <p>© 2026 Hexa Core Systems. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
