import React, { useState, useEffect } from 'react';
import { DateRangeFilter, type DateRangeOption } from '@/components/ui/DateRangeFilter';
import {
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  WifiOff,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MetricCard } from '@/components/ui/MetricCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useDashboardMetrics, useWeeklyFlow, useAuditLogs, useTenantConfig } from '@/lib/hooks';
import { formatTimestamp } from '@/lib/api';
import type { AuditLog } from '@/types/models';

// ── Mapeo de acciones para badges legibles ───────────────────────────────────
const accionBadgeMap: Record<string, { label: string; variant: 'cobalt' | 'emerald' | 'coral' | 'amber' }> = {
  REGISTRO_TRANSACCION_VENTA_DIRECTA: { label: 'Venta Directa', variant: 'emerald' },
  REGISTRO_TRANSACCION_CREDITO: { label: 'Crédito', variant: 'cobalt' },
  REGISTRO_TRANSACCION_CONSIGNACION: { label: 'Consignación', variant: 'amber' },
  ABONO_DEUDA: { label: 'Abono', variant: 'emerald' },
};

// ── Columnas del audit log ───────────────────────────────────────────────────
const auditColumns: Column<AuditLog>[] = [
  {
    header: 'Timestamp',
    accessor: 'timestamp',
    width: '180px',
    render: (row) => (
      <span className="font-mono text-xs text-gray-400">
        {formatTimestamp(row.timestamp)}
      </span>
    ),
  },
  {
    header: 'Usuario',
    accessor: 'user.name',
    width: '160px',
    render: (row) => (
      <span className="font-medium text-gray-200">{row.user?.name ?? '—'}</span>
    ),
  },
  {
    header: 'Acción',
    accessor: 'accion',
    render: (row) => {
      const mapped = accionBadgeMap[row.accion];
      return mapped ? (
        <Badge variant={mapped.variant} dot>{mapped.label}</Badge>
      ) : (
        <Badge variant="gray">{row.accion}</Badge>
      );
    },
  },
  {
    header: 'Detalles',
    accessor: 'detalles',
    render: (row) => {
      const d = row.detalles;
      const total = d.total != null ? `$${Number(d.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '';
      const monto = d.montoAbonado != null ? `$${Number(d.montoAbonado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '';
      return (
        <span className="text-xs text-gray-400">
          {total && <>Total: <span className="text-gray-200">{total}</span></>}
          {monto && <>Abono: <span className="text-hc-emerald">{monto}</span></>}
        </span>
      );
    },
  },
];

// ── Tooltip personalizado para el chart ──────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-gray-700/60 bg-hc-surface-dark p-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-gray-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs">
          <span className={entry.dataKey === 'ventas' ? 'text-hc-cobalt-light' : 'text-hc-emerald-light'}>
            {entry.dataKey === 'ventas' ? 'Ventas' : 'Cobros'}:
          </span>{' '}
          <span className="font-semibold text-gray-100">
            ${entry.value.toLocaleString('es-MX')}
          </span>
        </p>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═════════════════════════════════════════════════════════════════════════════

const metricIcons = [DollarSign, Package, AlertTriangle, TrendingUp];

// ── Error alert reutilizable ─────────────────────────────────────────────────
function SectionError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-4 py-3">
      <WifiOff className="h-4 w-4 flex-shrink-0 text-hc-coral" />
      <p className="text-xs text-hc-coral">
        <span className="font-semibold">Error de sincronización: </span>
        {message}
      </p>
    </div>
  );
}

export function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRangeOption>('today');
  
  const { data: metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useDashboardMetrics(dateRange);
  const { data: weeklyData, loading: chartLoading, error: chartError, refetch: refetchWeekly } = useWeeklyFlow(dateRange);
  const { data: logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useAuditLogs(dateRange);
  const { data: tenantConfig } = useTenantConfig();

  useEffect(() => {
    refetchMetrics();
    refetchWeekly();
    refetchLogs();
  }, [dateRange, refetchMetrics, refetchWeekly, refetchLogs]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">
            {tenantConfig?.name ? `Panel de Control - ${tenantConfig.name}` : 'Panel de Control'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen operativo — {tenantConfig?.industry ? `Giro: ${tenantConfig.industry} — ` : ''}{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="flex items-center gap-2 rounded-lg border border-gray-700/40 bg-hc-surface px-3 py-2">
            <Activity className="h-4 w-4 text-hc-emerald" />
            <span className="text-xs font-medium text-gray-300">Sistema Operativo</span>
          </div>
        </div>
      </div>

      {/* ── KPI Metrics Grid ─────────────────────────────────────── */}
      {metricsError ? (
        <SectionError message={metricsError} />
      ) : metricsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[140px] animate-pulse rounded-xl bg-hc-surface" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(metrics ?? []).map((m, i) => (
            <MetricCard key={m.title} {...m} icon={metricIcons[i]!} />
          ))}
        </div>
      )}

      {/* ── Weekly Cash Flow Chart ───────────────────────────────── */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Flujo de Caja Semanal</h2>
            <p className="text-xs text-gray-500">Ventas vs. cobros por día</p>
          </div>
          <Badge variant="cobalt" size="md">Esta semana</Badge>
        </div>

        {chartError ? (
          <div className="flex h-[300px] items-center justify-center">
            <SectionError message={chartError} />
          </div>
        ) : chartLoading ? (
          <div className="h-[300px] animate-pulse rounded-lg bg-hc-surface-dark" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData ?? []} barGap={4} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12, fontFamily: 'Inter' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'Inter' }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }} />
              <Legend
                wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter', color: '#9CA3AF' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="ventas"
                name="Ventas"
                fill="#004BFF"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="cobros"
                name="Cobros"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Audit Log Table ──────────────────────────────────────── */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Registro de Auditoría</h2>
            <p className="text-xs text-gray-500">Últimas operaciones del sistema</p>
          </div>
          <span className="text-xs text-gray-500">
            {logs?.length ?? 0} registros
          </span>
        </div>

        {logsError ? (
          <SectionError message={logsError} />
        ) : logsLoading ? (
          <div className="h-[300px] animate-pulse rounded-lg bg-hc-surface-dark" />
        ) : (
          <DataTable
            columns={auditColumns}
            data={logs ?? []}
            compact
            keyExtractor={(row) => row.id}
            emptyMessage="Sin registros de auditoría"
          />
        )}
      </div>
    </div>
  );
}
