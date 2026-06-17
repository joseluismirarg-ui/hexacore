import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, AlertTriangle, Search } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatCurrency, clientesApi, ApiError } from '@/lib/api';

interface Customer {
  id: string;
  companyName: string;
  rfc?: string;
  email?: string;
  phone?: string;
  creditLimit: string;
  currentDebt: string;
}

function CreditBar({ debt, limit }: { debt: string; limit: string }) {
  const pct = Number(limit) > 0 ? (Number(debt) / Number(limit)) * 100 : 0;
  const color =
    pct >= 90 ? 'bg-hc-coral' : pct >= 60 ? 'bg-amber-400' : 'bg-hc-emerald';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-hc-surface-dark">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${pct >= 90 ? 'text-hc-coral' : pct >= 60 ? 'text-amber-400' : 'text-hc-emerald'}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

const columns: Column<Customer>[] = [
  {
    header: 'Empresa',
    accessor: 'companyName',
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-gray-100">{row?.companyName}</p>
        {row?.rfc && <p className="font-mono text-xxs text-gray-500">{row?.rfc}</p>}
      </div>
    ),
  },
  {
    header: 'Contacto',
    accessor: 'email',
    render: (row) => (
      <div className="text-xs text-gray-400">
        {row?.email && <p>{row?.email}</p>}
        {row?.phone && <p>{row?.phone}</p>}
        {!row?.email && !row?.phone && <span className="text-gray-600">—</span>}
      </div>
    ),
  },
  {
    header: 'Límite Crédito',
    accessor: 'creditLimit',
    align: 'right',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-sm text-gray-300">
        {formatCurrency(row?.creditLimit)}
      </span>
    ),
  },
  {
    header: 'Deuda Actual',
    accessor: 'currentDebt',
    align: 'right',
    sortable: true,
    render: (row) => (
      <span
        className={`font-mono text-sm font-semibold ${
          Number(row?.currentDebt || 0) > 0 ? 'text-hc-coral-light' : 'text-hc-emerald'
        }`}
      >
        {formatCurrency(row?.currentDebt)}
      </span>
    ),
  },
  {
    header: 'Utilización',
    accessor: 'creditLimit',
    render: (row) => <CreditBar debt={row?.currentDebt || '0'} limit={row?.creditLimit || '0'} />,
  },
  {
    header: 'Estado',
    accessor: 'currentDebt',
    render: (row) => {
      const pct = Number(row?.creditLimit || 0) > 0
        ? (Number(row?.currentDebt || 0) / Number(row?.creditLimit || 0)) * 100
        : 0;
      if (pct >= 90) return <Badge variant="coral" dot size="sm">Bloqueado</Badge>;
      if (pct >= 60) return <Badge variant="amber" dot size="sm">Próximo a vencer</Badge>;
      return <Badge variant="emerald" dot size="sm">Al corriente</Badge>;
    },
  },
];

// ═════════════════════════════════════════════════════════════════════════════
export function DirectorioClientes() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await clientesApi.listar() as any;
        console.log('👥 DATOS DE CLIENTES RECIBIDOS:', res.data);
        if (!cancelled) setCustomers(res.data ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : 'Error al cargar clientes');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // [] estricto

  const filtered = (customers || []).filter((c) =>
    search === '' ||
    (c?.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c?.rfc || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalDeuda = (customers || []).reduce((s, c) => s + Number(c?.currentDebt || 0), 0);
  const conDeuda = (customers || []).filter((c) => Number(c?.currentDebt || 0) > 0).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Directorio de Clientes</h1>
        <p className="mt-1 text-sm text-gray-500">CRM · Cartera y crédito B2B</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-hc-surface" />
          ))
        ) : (
          <>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-cobalt/15">
                <Users className="h-5 w-5 text-hc-cobalt-light" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Total clientes</p>
                <p className="text-2xl font-bold text-gray-100">{customers.length}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-coral/10">
                <AlertTriangle className="h-5 w-5 text-hc-coral" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Con deuda activa</p>
                <p className="text-2xl font-bold text-hc-coral">{conDeuda}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-emerald/10">
                <TrendingUp className="h-5 w-5 text-hc-emerald" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Deuda total</p>
                <p className="text-xl font-bold text-hc-emerald">{formatCurrency(totalDeuda)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search + Table */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-gray-700/40">
          <div className="max-w-sm">
            <Input
              label=""
              placeholder="Buscar empresa o RFC..."
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
            emptyMessage="Sin clientes registrados"
          />
        )}
      </div>
    </div>
  );
}
