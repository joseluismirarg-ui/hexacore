import React, { useEffect, useState } from 'react';
import { Users, Search, AlertTriangle } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { usuariosApi, ApiError } from '@/lib/api';

interface Seller {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: Column<Seller>[] = [
  {
    header: 'Nombre del Vendedor',
    accessor: 'name',
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-gray-100">{row?.name}</p>
        <p className="font-mono text-xxs text-gray-500">{row?.id}</p>
      </div>
    ),
  },
  {
    header: 'Contacto',
    accessor: 'email',
    render: (row) => (
      <div className="text-xs text-gray-400">
        {row?.email ? <p>{row?.email}</p> : <span className="text-gray-600">—</span>}
      </div>
    ),
  },
  {
    header: 'Rol',
    accessor: 'role',
    render: (row) => (
      <Badge variant="cobalt" size="sm">{row?.role}</Badge>
    ),
  }
];

export function DirectorioVendedores() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await usuariosApi.vendedores() as any;
        if (!cancelled) setSellers(res.data ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : 'Error al cargar vendedores');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = (sellers || []).filter((s) =>
    search === '' ||
    (s?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s?.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Directorio de Vendedores</h1>
        <p className="mt-1 text-sm text-gray-500">CRM · Gestión de equipo de ventas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-hc-surface" />
          ))
        ) : (
          <div className="card flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-cobalt/15">
              <Users className="h-5 w-5 text-hc-cobalt-light" />
            </div>
            <div>
              <p className="text-xxs text-gray-500 uppercase tracking-wider">Total Vendedores</p>
              <p className="text-2xl font-bold text-gray-100">{sellers.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search + Table */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-gray-700/40">
          <div className="max-w-sm">
            <Input
              label=""
              placeholder="Buscar por nombre o correo..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="h-[400px] animate-pulse bg-hc-surface-dark rounded-b-xl" />
        ) : error ? (
          <div className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-hc-coral" />
            <p className="text-sm text-hc-coral">{error}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            compact
            keyExtractor={(row) => row.id}
            emptyMessage="Sin vendedores registrados"
          />
        )}
      </div>
    </div>
  );
}
