import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { api } from '../../lib/api';

export function AlertasPredictivas() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics/predictive');
      if (res.success && res.data) {
        setAlerts(res.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        await api.post('/api/analytics/predictive/run', {});
        await refetch();
      } catch {
        setError(true);
        setLoading(false);
      }
    };
    runAnalysis();
  }, []);

  if (loading) return <div className="text-gray-400 text-sm animate-pulse">Analizando velocidad de salida...</div>;
  if (error) return null;
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-gray-800 border border-red-500/30 rounded-xl p-4 shadow-lg mb-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <h3 className="text-red-400 font-bold text-lg">Inteligencia de Inventario</h3>
      </div>
      <div className="space-y-4">
        {alerts.map((alert: any) => {
          const isCritical = alert.estimatedDaysLeft <= 3;
          return (
            <div key={alert.id} className="bg-gray-900 rounded p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-start gap-3">
                <TrendingDown className={`h-5 w-5 mt-1 ${isCritical ? 'text-red-500' : 'text-yellow-500'}`} />
                <div>
                  <p className="font-semibold text-gray-100">
                    ¡Alerta de Reorden! Tu ritmo de venta indica que <span className="text-white font-bold">{alert.item.name} ({alert.item.sku})</span> se agotará pronto.
                  </p>
                  <p className="text-sm text-gray-400">
                    Stock actual: <span className="font-bold text-gray-300">{alert.currentStock}</span> | 
                    Días estimados restantes: <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}>{alert.estimatedDaysLeft}</span> | 
                    Velocidad: {Number(alert.velocityRate).toFixed(1)} u/día
                  </p>
                </div>
              </div>
              <button className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-lg transition-colors text-sm">
                Generar OC Automática
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
