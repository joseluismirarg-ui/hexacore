import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/Badge';
import { api } from '../lib/api';

export default function LandlordDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/landlord/dashboard');
      if (res.success) {
        setData(res.data || res); // fallback just in case it returns raw json
      } else {
        setError('Error fetching data');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  const suspendTenant = async (id: string, newStatus: string) => {
    if (!window.confirm(`¿Seguro que quieres cambiar el estatus a ${newStatus}?`)) return;
    setActionLoading(id);
    try {
      await api.post(`/api/landlord/tenants/${id}/suspend`, { status: newStatus });
      refetch();
    } catch (e) {
      alert('Error cambiando estatus');
    }
    setActionLoading(null);
  };

  if (loading) return <div className="p-8 text-white">Cargando métricas maestras...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 text-white space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-blue-400">Panel de Control Maestro (Landlord)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-2">Total de Tenants Activos</h2>
          <p className="text-5xl font-black text-emerald-400">{data?.metrics.totalTenants}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl h-64">
          <h2 className="text-xl font-semibold mb-4">Distribución por Giros</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.metrics.tenantsByIndustry || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Empresas Registradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50">
                <th className="p-4 text-sm font-semibold text-gray-400">ID / Empresa</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Giro</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Plan</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Estatus</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Acción Coercitiva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data?.tenants.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-100">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.id}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-300">{t.industry}</td>
                  <td className="p-4"><Badge variant="cobalt">{t.plan}</Badge></td>
                  <td className="p-4">
                    <Badge variant={t.status === 'ACTIVE' ? 'emerald' : t.status === 'SUSPENDED' ? 'coral' : 'amber'}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {t.id !== 'default-tenant' && (
                      <button
                        disabled={actionLoading === t.id}
                        onClick={() => suspendTenant(t.id, t.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                        className={`px-3 py-1 text-sm font-bold rounded ${t.status === 'SUSPENDED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        {actionLoading === t.id ? '...' : t.status === 'SUSPENDED' ? 'Reactivar' : 'Congelar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
