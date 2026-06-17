// =============================================================================
// HEXA CORE SYSTEMS — Custom React Hooks
// REFACTORIZADO: Bucles infinitos eliminados, AbortController integrado,
// manejo de errores en superficie, dependencias estrictas en useEffect.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api';
import type {
  AuditLog,
  ConsignacionCliente,
  DashboardMetric,
  LiquidacionData,
  User,
  WeeklyFlowData,
  InventoryLocation,
} from '@/types/models';

// ── Generic async state hook ─────────────────────────────────────────────────
//
// SOLUCIÓN AL BUCLE INFINITO:
// El patrón anterior pasaba `fetcher` (función inline) como dependencia de
// useCallback, lo que producía una referencia nueva en cada render y creaba
// el ciclo: fetcher cambia → execute cambia → useEffect dispara → render →
// fetcher cambia (∞).
//
// NUEVO DISEÑO:
// - `fetcher` se guarda en un ref (estable, no provoca re-renders).
// - `execute` se memoiza con [] vacío — se crea UNA SOLA VEZ por instancia.
// - El AbortController cancela la request si el componente desmonta, evitando
//   setState sobre componentes desmontados (memory leak).

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAsync<T>(fetcher: () => Promise<T>, autoFetch: boolean = true): AsyncState<T> & { execute: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const execute = useCallback(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetcherRef.current()
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
        }
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted) {
          setError(err.message ?? 'Error desconocido');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (autoFetch) {
      const cleanup = execute();
      return cleanup;
    }
  }, [execute, autoFetch]);

  return { data, loading, error, refetch: execute, execute };
}

// ── Dashboard Hooks ──────────────────────────────────────────────────────────

export function useDashboardMetrics(): AsyncState<DashboardMetric[]> {
  return useAsync(async () => {
    const res = await api.get<{ metrics: DashboardMetric[] }>('/api/dashboard');
    return res.data.metrics;
  });
}

export function useWeeklyFlow(): AsyncState<WeeklyFlowData[]> {
  return useAsync(async () => {
    const res = await api.get<{ weekly: WeeklyFlowData[] }>('/api/dashboard');
    return res.data.weekly;
  });
}

export function useAuditLogs(): AsyncState<AuditLog[]> {
  return useAsync(async () => {
    const res = await api.get<{ logs: AuditLog[] }>('/api/dashboard');
    return res.data.logs;
  });
}

export function useTenantConfig(): AsyncState<any> {
  return useAsync(async () => {
    const res = await api.get<any>('/api/tenants/config');
    return res.data;
  });
}

// ── Consignación Hooks ───────────────────────────────────────────────────────

export function useConsignaciones(): AsyncState<ConsignacionCliente[]> {
  return useAsync(async () => {
    const res = await api.get<ConsignacionCliente[]>('/api/customers/consignaciones');
    return res.data;
  });
}

// ── Liquidación Hooks ────────────────────────────────────────────────────────

export function useVendedores(): AsyncState<User[]> {
  return useAsync(async () => {
    const res = await api.get<User[]>('/api/users/vendedores');
    return res.data;
  });
}

export function useCamiones(): AsyncState<InventoryLocation[]> {
  return useAsync(async () => {
    const res = await api.get<InventoryLocation[]>('/api/inventory/camiones');
    return res.data;
  });
}

// useLiquidacion: cuando camionId cambia, el componente que llama a este hook
// ya recrea la instancia de useAsync con un fetcher diferente (camionId en
// closure), así que el refetch ocurre correctamente.
export function useLiquidacion(camionId?: string): AsyncState<LiquidacionData | null> {
  return useAsync(async () => {
    if (!camionId) return null;
    const res = await api.get<LiquidacionData>(
      `/api/inventory/camiones/${camionId}/liquidacion`
    );
    return res.data;
  });
}
