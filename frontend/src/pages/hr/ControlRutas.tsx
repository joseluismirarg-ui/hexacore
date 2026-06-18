import React, { useEffect } from 'react';
import { useAsync } from '@/lib/hooks';
import { hrApi, formatDate } from '@/lib/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { MapPin, Navigation } from 'lucide-react';

export default function ControlRutas() {
  const { data: routesData, loading, execute: fetchRoutes } = useAsync(() => hrApi.listarVisitas(), false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const visits = (routesData as any)?.data || [];

  const columns: Column<any>[] = [
    { header: 'Fecha y Hora', accessor: 'visitDate', render: (row: any) => new Date(row.visitDate).toLocaleString() },
    { header: 'Vendedor', accessor: 'user', render: (row: any) => row.user?.name || '---' },
    { header: 'Cliente Visitado', accessor: 'customer', render: (row: any) => row.customer?.companyName || '---' },
    { header: 'Notas / Ubicación', accessor: 'notes', render: (row: any) => row.notes || 'Visita registrada' },
    { 
      header: 'Estatus', 
      accessor: 'status',
      render: (row: any) => (
        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-medium border border-green-500/20">
          {row.status}
        </span>
      ) 
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Control de Rutas</h2>
          <p className="text-sm text-muted-foreground">Registro de visitas a clientes en tiempo real</p>
        </div>
        <button 
          onClick={fetchRoutes}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/80"
        >
          <MapPin className="w-4 h-4" />
          Actualizar Registros
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden p-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
        ) : (
          <DataTable columns={columns} data={visits} keyExtractor={(row: any) => row.id} />
        )}
      </div>
    </div>
  );
}
