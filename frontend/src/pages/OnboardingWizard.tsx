import React, { useState } from 'react';

const OnboardingWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', industry: 'GENERAL' });
  const [loading, setLoading] = useState(false);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tenants/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('Empresa configurada exitosamente.');
        window.location.href = '/';
      } else {
        alert('Error al configurar la empresa.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-lg w-full text-white">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Configuración Inicial</h1>
        
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl mb-4">¿Cuál es el nombre de tu empresa?</h2>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none mb-6"
              placeholder="Ej. Mi Empresa S.A."
            />
            <button 
              onClick={handleNext}
              disabled={!formData.name}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl mb-4">Selecciona tu Giro Principal</h2>
            <div className="space-y-4 mb-6">
              {['GENERAL', 'RETAIL', 'CONSTRUCTION', 'OIL'].map(ind => (
                <label key={ind} className={`block p-4 rounded border cursor-pointer transition-colors ${formData.industry === ind ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 hover:bg-gray-700'}`}>
                  <input
                    type="radio"
                    name="industry"
                    value={ind}
                    checked={formData.industry === ind}
                    onChange={() => setFormData({ ...formData, industry: ind })}
                    className="hidden"
                  />
                  <span className="font-bold">{ind}</span>
                  <p className="text-sm text-gray-400">
                    {ind === 'GENERAL' && 'Configuración estándar multi-propósito.'}
                    {ind === 'RETAIL' && 'Optimizado para punto de venta y sucursales.'}
                    {ind === 'CONSTRUCTION' && 'Gestión de obras, materiales pesados (Aceros, Cementos).'}
                    {ind === 'OIL' && 'Gestión de Tambos, litros y rutas de entrega.'}
                  </p>
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handlePrev}
                className="w-1/3 bg-gray-600 hover:bg-gray-500 p-3 rounded font-bold"
              >
                Atrás
              </button>
              <button 
                onClick={handleFinish}
                disabled={loading}
                className="w-2/3 bg-green-600 hover:bg-green-700 p-3 rounded font-bold"
              >
                {loading ? 'Configurando...' : 'Finalizar y Entrar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
