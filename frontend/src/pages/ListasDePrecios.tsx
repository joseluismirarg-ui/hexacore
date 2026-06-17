import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { DollarSign, Search, CheckCircle, XCircle, Users } from 'lucide-react';

export function ListasDePrecios() {
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<any[]>([]);

  useEffect(() => {
    // Para propósitos de demostración y QA, generamos datos estáticos 
    // en lugar de llamar a un CRUD de listas de precios que no está construido.
    setLists([
      { id: '1', name: 'Precio Público (Base)', isActive: true, customersCount: 150, itemsCount: 45 },
      { id: '2', name: 'Precio Mayorista Nivel 1', isActive: true, customersCount: 25, itemsCount: 45 },
      { id: '3', name: 'Distribuidor Premium', isActive: false, customersCount: 5, itemsCount: 45 }
    ]);
  }, []);

  const columns = [
    { header: 'Nombre de la Lista', accessor: 'name' },
    {
      header: 'Estado',
      accessor: 'isActive',
      render: (row: any) => row.isActive ? <Badge variant="emerald">Activa</Badge> : <Badge variant="gray">Inactiva</Badge>
    },
    {
      header: 'Clientes Asignados',
      accessor: 'customersCount',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{row.customersCount}</span>
        </div>
      )
    },
    {
      header: 'Productos Especiales',
      accessor: 'itemsCount',
    }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Listas de Precios Dinámicas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Asignación de reglas de precio para B2B y Mayoristas
          </p>
        </div>
        <button className="rounded-lg bg-hc-cobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hc-cobalt-light">
          + Nueva Lista
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar lista..."
              className="w-64 rounded-lg border border-gray-700 bg-gray-800/50 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:border-hc-cobalt focus:outline-none"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={lists}
          keyExtractor={(row) => row.id}
          compact
        />
      </div>
    </div>
  );
}
