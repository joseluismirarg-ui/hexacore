import React, { useState, useMemo } from 'react';
import { Search, Filter, Package } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { Input } from '@/components/ui/Input';
import { useConsignaciones } from '@/lib/hooks';
import { formatCurrency } from '@/lib/api';
import type { ConsignacionCliente } from '@/types/models';

// ── Estado → StatusDot mapping ───────────────────────────────────────────────
const estadoConfig = {
  al_corriente: { status: 'active' as const, label: 'Al Corriente', badgeVariant: 'emerald' as const },
  proximo_vencer: { status: 'warning' as const, label: 'Próximo a Vencer', badgeVariant: 'amber' as const },
  bloqueado: { status: 'danger' as const, label: 'Bloqueado', badgeVariant: 'coral' as const },
};

type FilterStatus = 'todos' | 'al_corriente' | 'proximo_vencer' | 'bloqueado';

// ── Credit utilization progress bar ──────────────────────────────────────────
function CreditBar({ percent }: { percent: number }) {
  const color =
    percent >= 90
      ? 'bg-hc-coral'
      : percent >= 60
      ? 'bg-amber-400'
      : 'bg-hc-emerald';

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-hc-surface-dark">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold ${
          percent >= 90 ? 'text-hc-coral' : percent >= 60 ? 'text-amber-400' : 'text-hc-emerald'
        }`}
      >
        {percent.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Columnas de la tabla ─────────────────────────────────────────────────────
const columns: Column<ConsignacionCliente>[] = [
  {
    header: 'Estado',
    accessor: 'estado',
    width: '50px',
    render: (row) => {
      const cfg = estadoConfig[row.estado];
      return <StatusDot status={cfg.status} pulse={row.estado === 'bloqueado'} />;
    },
  },
  {
    header: 'Cliente',
    accessor: 'customer.companyName',
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-gray-100">{row.customer.companyName}</p>
        <p className="text-xxs text-gray-500">{row.customer.id}</p>
      </div>
    ),
  },
  {
    header: 'Límite de Crédito',
    accessor: 'customer.creditLimit',
    align: 'right',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-sm text-gray-300">
        {formatCurrency(row.customer.creditLimit)}
      </span>
    ),
  },
  {
    header: 'Deuda Actual',
    accessor: 'customer.currentDebt',
    align: 'right',
    sortable: true,
    render: (row) => {
      const debt = parseFloat(row.customer.currentDebt);
      return (
        <span
          className={`font-mono text-sm font-semibold ${
            debt > 0 ? 'text-hc-coral-light' : 'text-hc-emerald'
          }`}
        >
          {formatCurrency(row.customer.currentDebt)}
        </span>
      );
    },
  },
  {
    header: 'Utilización',
    accessor: 'porcentajeUtilizado',
    width: '180px',
    render: (row) => <CreditBar percent={row.porcentajeUtilizado} />,
  },
  {
    header: 'SKUs Consignados',
    accessor: 'skusConsignados',
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.skusConsignados.map((s) => (
          <span
            key={s.product.sku}
            className="inline-flex items-center gap-1 rounded bg-hc-surface-dark px-1.5 py-0.5 text-xxs font-mono text-gray-400"
            title={`${s.product.name}: ${s.cantidad} uds`}
          >
            <Package className="h-3 w-3 text-gray-500" />
            {s.product.sku.split('-')[0]}
            <span className="font-semibold text-gray-200">×{s.cantidad}</span>
          </span>
        ))}
      </div>
    ),
  },
  {
    header: 'Clasificación',
    accessor: 'estado',
    width: '140px',
    render: (row) => {
      const cfg = estadoConfig[row.estado];
      return <Badge variant={cfg.badgeVariant} dot size="md">{cfg.label}</Badge>;
    },
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// RUTAS CONSIGNACIÓN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export function RutasConsignacion() {
  const { data: consignaciones, loading, error } = useConsignaciones();
  const [filter, setFilter] = useState<FilterStatus>('todos');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!consignaciones) return [];
    return consignaciones.filter((c) => {
      const matchesFilter = filter === 'todos' || c.estado === filter;
      const matchesSearch =
        search === '' ||
        c.customer.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.skusConsignados.some((s) =>
          s.product.sku.toLowerCase().includes(search.toLowerCase())
        );
      return matchesFilter && matchesSearch;
    });
  }, [consignaciones, filter, search]);

  // Resumen stats
  const stats = useMemo(() => {
    if (!consignaciones) return { total: 0, alCorriente: 0, proximo: 0, bloqueado: 0 };
    return {
      total: consignaciones.length,
      alCorriente: consignaciones.filter((c) => c.estado === 'al_corriente').length,
      proximo: consignaciones.filter((c) => c.estado === 'proximo_vencer').length,
      bloqueado: consignaciones.filter((c) => c.estado === 'bloqueado').length,
    };
  }, [consignaciones]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Monitoreo de Consignaciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control de resguardos, crédito y SKUs en posesión de clientes
        </p>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filtrar:</span>
        </div>

        <Badge
          variant="gray"
          size="md"
          active={filter === 'todos'}
          onClick={() => setFilter('todos')}
        >
          Todos ({stats.total})
        </Badge>
        <Badge
          variant="emerald"
          size="md"
          dot
          active={filter === 'al_corriente'}
          onClick={() => setFilter('al_corriente')}
        >
          Al Corriente ({stats.alCorriente})
        </Badge>
        <Badge
          variant="amber"
          size="md"
          dot
          active={filter === 'proximo_vencer'}
          onClick={() => setFilter('proximo_vencer')}
        >
          Próximo a Vencer ({stats.proximo})
        </Badge>
        <Badge
          variant="coral"
          size="md"
          dot
          active={filter === 'bloqueado'}
          onClick={() => setFilter('bloqueado')}
        >
          Bloqueado ({stats.bloqueado})
        </Badge>

        <div className="ml-auto w-64">
          <Input
            label=""
            placeholder="Buscar cliente o SKU..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────── */}
      <div className="card p-0">
        {error ? (
          <div className="flex items-center gap-3 px-5 py-6">
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-hc-coral/10">
              <Filter className="h-4 w-4 text-hc-coral" />
            </span>
            <div>
              <p className="text-sm font-semibold text-hc-coral">Error al sincronizar consignaciones</p>
              <p className="text-xs text-gray-400">{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="h-[400px] animate-pulse rounded-xl bg-hc-surface" />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            compact
            keyExtractor={(row) => row.customer.id}
            emptyMessage="No se encontraron clientes con los filtros seleccionados"
          />
        )}
      </div>

      {/* ── Summary Footer ───────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border border-gray-700/40 bg-hc-surface-dark px-5 py-3">
        <span className="text-xs text-gray-500">
          Mostrando {filtered.length} de {consignaciones?.length ?? 0} clientes
        </span>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">
            Unidades en consignación:{' '}
            <span className="font-semibold text-hc-cobalt-light">
              {filtered.reduce(
                (sum, c) => sum + c.skusConsignados.reduce((s, sk) => s + sk.cantidad, 0),
                0
              ).toLocaleString('es-MX')}
            </span>
          </span>
          <span className="text-gray-500">
            Deuda total filtrada:{' '}
            <span className="font-semibold text-hc-coral-light">
              {formatCurrency(
                filtered.reduce((sum, c) => sum + Number(c.customer.currentDebt), 0)
              )}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
