import React, { useState } from 'react';
import { api, formatCurrency } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';

export function TMSAnalyticsTab() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    fleetId: '',
    tripId: ''
  });

  const queryString = new URLSearchParams(filters as any).toString();
  const { data, loading, execute } = useAsync(() => api.get(`/api/trucks/analytics/profitability?${queryString}`), true);

  const kpis = (data as any)?.data?.kpis || {};
  const trips = (data as any)?.data?.trips || [];

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    execute();
  };

  const columns: Column<any>[] = [
    { header: 'ID Viaje', accessor: 'tripId' },
    { header: 'Unidad', accessor: 'truckPlates' },
    { header: 'Operador', accessor: 'driverName' },
    { header: 'Ingreso', accessor: 'revenue', render: (val: any) => <span className="text-green-400 font-bold">{formatCurrency(val)}</span> },
    { header: 'Costo Fijo', accessor: 'fixedCosts', render: (val: any) => formatCurrency(val) },
    { header: 'Viáticos (Variable)', accessor: 'variableCosts', render: (val: any) => <span className="text-red-400">{formatCurrency(val)}</span> },
    { 
      header: 'Utilidad Neta', 
      accessor: 'netProfit', 
      render: (val: any) => (
        <span className={`font-black ${val > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(val)}
        </span>
      )
    },
    { 
      header: 'Margen', 
      accessor: 'profitMargin', 
      render: (val: any) => (
        <span className={`font-bold ${val > 20 ? 'text-green-400' : val > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
          {Number(val).toFixed(2)}%
        </span>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <form onSubmit={handleFilter} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Desde</label>
          <input 
            type="date" 
            value={filters.startDate}
            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Hasta</label>
          <input 
            type="date" 
            value={filters.endDate}
            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">ID Viaje Opcional</label>
          <input 
            type="text" 
            placeholder="TRP-XXXX"
            value={filters.tripId}
            onChange={e => setFilters({ ...filters, tripId: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white outline-none focus:border-primary"
          />
        </div>
        <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-bold transition-colors h-[42px]">
          Analizar
        </button>
      </form>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 text-green-500"><TrendingUp size={100} /></div>
          <p className="text-sm text-gray-400 font-semibold mb-1">Ingreso Operativo Total</p>
          <h2 className="text-3xl font-black text-white">{formatCurrency(kpis.totalRevenue || 0)}</h2>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 text-red-500"><TrendingDown size={100} /></div>
          <p className="text-sm text-gray-400 font-semibold mb-1">Costo Operativo (Fijo + Var)</p>
          <h2 className="text-3xl font-black text-red-400">{formatCurrency(kpis.totalCostsOperative || 0)}</h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 text-primary"><DollarSign size={100} /></div>
          <p className="text-sm text-gray-400 font-semibold mb-1">Utilidad Neta</p>
          <h2 className={`text-3xl font-black ${(kpis.netProfitTotal || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(kpis.netProfitTotal || 0)}
          </h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 opacity-10 text-blue-500"><Activity size={100} /></div>
          <div>
            <p className="text-sm text-gray-400 font-semibold mb-1">Margen de Rentabilidad</p>
            <h2 className={`text-3xl font-black ${
              (kpis.profitMarginTotal || 0) > 20 ? 'text-green-400' :
              (kpis.profitMarginTotal || 0) > 0 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {Number(kpis.profitMarginTotal || 0).toFixed(2)}%
            </h2>
          </div>
          {(kpis.profitMarginTotal || 0) < 15 && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <AlertCircle size={12} /> Alerta de baja rentabilidad
            </p>
          )}
        </div>
      </div>

      {/* Tabla Desglose */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg p-1">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Desglose Unit Economics por Viaje</h3>
        </div>
        <DataTable columns={columns} data={trips} keyExtractor={(row: any) => row.id} emptyMessage="No hay viajes liquidados en este periodo." />
      </div>
    </div>
  );
}
