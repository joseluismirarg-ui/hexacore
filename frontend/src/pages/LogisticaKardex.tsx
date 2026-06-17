import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeftRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { AlertasPredictivas } from '@/components/ui/AlertasPredictivas';
import { Button } from '@/components/ui/Button';
import { formatTimestamp, inventarioApi, usuariosApi, ApiError } from '@/lib/api';

interface InventoryLocation {
  id: string;
  name: string;
  tipo: string;
  inventoryStocks: Array<{
    product: { id: string; sku: string; name: string; globalStock: number };
    quantity: number;
  }>;
}

interface User {
  id: string;
  name: string;
}

interface KardexEntry {
  id: string;
  tipo: string;
  cantidad: number;
  timestamp: string;
  product: { id: string; sku: string; name: string };
  user: { id: string; name: string };
  locationOrigenId?: string;
  locationDestinoId?: string;
  notes?: string;
}

const tipoKardexConfig: Record<string, { label: string; variant: 'emerald' | 'cobalt' | 'amber' | 'gray' }> = {
  ENTRADA_COMPRA: { label: 'Entrada Compra', variant: 'emerald' },
  SALIDA_VENTA: { label: 'Salida Venta', variant: 'cobalt' },
  TRASPASO: { label: 'Traspaso', variant: 'amber' },
  AJUSTE_INVENTARIO: { label: 'Ajuste', variant: 'gray' },
};

// ═════════════════════════════════════════════════════════════════════════════
export function LogisticaKardex() {
  const [almacenes, setAlmacenes] = useState<InventoryLocation[]>([]);
  const [kardex, setKardex] = useState<KardexEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedOrigen, setSelectedOrigen] = useState('');
  const [selectedDestino, setSelectedDestino] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [aRes, kRes, uRes] = await Promise.all([
        inventarioApi.almacenes() as any,
        inventarioApi.kardex() as any,
        usuariosApi.vendedores() as any,
      ]);
      
      console.log('📦 DATOS RECIBIDOS EN LOGÍSTICA:', {
        almacenes: aRes.data,
        kardex: kRes.data,
        usuarios: uRes.data
      });

      setAlmacenes(aRes.data ?? []);
      setKardex(kRes.data ?? []);
      setUsers(uRes.data ?? []);
      if ((uRes.data ?? []).length > 0) setSelectedUser(uRes.data[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // [] estricto — solo al montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Todos los productos disponibles de todos los almacenes
  const allProducts = (almacenes || []).flatMap((a) =>
    (a?.inventoryStocks || []).map((s) => ({ ...s?.product, locationId: a?.id }))
  );
  const uniqueProducts = (allProducts || []).filter(
    (p, i, arr) => arr.findIndex((x) => x?.id === p?.id) === i
  );

  const handleTraspaso = async () => {
    if (!selectedProduct || !selectedOrigen || !selectedDestino || !selectedUser || !cantidad)
      return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await inventarioApi.traspaso({
        productId: selectedProduct,
        cantidad: parseInt(cantidad, 10),
        locationOrigenId: selectedOrigen,
        locationDestinoId: selectedDestino,
        userId: selectedUser,
        notes: notes.trim() || undefined,
      });

      setSubmitSuccess(true);
      setCantidad('');
      setNotes('');
      loadData();
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Error al registrar traspaso');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Logística & Kardex</h1>
          <p className="mt-1 text-sm text-gray-500">
            Traspasos entre almacenes · Historial inmutable de movimientos
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
          Actualizar
        </Button>
      </div>

      <AlertasPredictivas />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ═══ LEFT — Formulario de traspaso ═══ */}
        <div className="xl:col-span-5">
          <div className="card space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <ArrowLeftRight className="h-4 w-4 text-hc-cobalt-light" />
              Registrar Traspaso
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-hc-cobalt-light" />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Producto</label>
                  <select
                    className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">— Seleccionar producto —</option>
                    {(uniqueProducts || []).map((p) => (
                      <option key={p?.id} value={p?.id}>
                        {p?.sku} · {p?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      Almacén Origen
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                      value={selectedOrigen}
                      onChange={(e) => setSelectedOrigen(e.target.value)}
                    >
                      <option value="">— Origen —</option>
                      {(almacenes || []).map((a) => (
                        <option key={a?.id} value={a?.id}>{a?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      Almacén Destino
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                      value={selectedDestino}
                      onChange={(e) => setSelectedDestino(e.target.value)}
                    >
                      <option value="">— Destino —</option>
                      {(almacenes || [])
                        .filter((a) => a?.id !== selectedOrigen)
                        .map((a) => (
                          <option key={a?.id} value={a?.id}>{a?.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Responsable</label>
                    <select
                      className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      {(users || []).map((u) => (
                        <option key={u?.id} value={u?.id}>{u?.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Motivo del traspaso..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none resize-none"
                  />
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-hc-coral flex-shrink-0" />
                    <p className="text-xs text-hc-coral">{submitError}</p>
                  </div>
                )}

                {submitSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-hc-emerald/30 bg-hc-emerald/5 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-hc-emerald" />
                    <p className="text-xs text-hc-emerald">Traspaso registrado correctamente</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={ArrowLeftRight}
                  loading={submitting}
                  disabled={
                    !selectedProduct || !selectedOrigen || !selectedDestino || !cantidad || !selectedUser
                  }
                  onClick={handleTraspaso}
                >
                  Registrar Traspaso
                </Button>
              </>
            )}
          </div>

          {/* Stock por almacén */}
          {!isLoading && (
            <div className="mt-4 card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Package className="h-4 w-4 text-hc-cobalt-light" />
                Stock por Almacén
              </h3>
              <div className="space-y-3">
                {(almacenes || []).map((a) => (
                  <div key={a?.id}>
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">{a?.name}</p>
                    {(a?.inventoryStocks || []).length === 0 ? (
                      <p className="text-xxs text-gray-600 pl-2">Sin stock registrado</p>
                    ) : (
                      (a?.inventoryStocks || []).slice(0, 10).map((s) => (
                        <div
                          key={s?.product?.id}
                          className="flex items-center justify-between rounded-lg bg-hc-surface-dark px-3 py-1.5 mb-1"
                        >
                          <span className="text-xs text-gray-300 truncate">{s?.product?.name}</span>
                          <Badge variant={s?.quantity === 0 ? 'coral' : 'cobalt'} size="sm">
                            {s?.quantity}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT — Historial Kardex ═══ */}
        <div className="xl:col-span-7">
          <div className="card p-0">
            <div className="px-5 py-3 border-b border-gray-700/40">
              <h2 className="text-sm font-semibold text-gray-200">
                Historial de Movimientos
              </h2>
              <p className="text-xxs text-gray-500">Registro inmutable de Kardex</p>
            </div>

            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-hc-surface-dark" />
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-6">
                <AlertTriangle className="h-5 w-5 text-hc-coral" />
                <p className="text-sm text-hc-coral">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-700/40 bg-hc-surface-dark">
                      {['Timestamp', 'Tipo', 'Producto', 'Cantidad', 'Usuario'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {(kardex || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                          Sin movimientos registrados
                        </td>
                      </tr>
                    ) : (
                      (kardex || []).map((k) => {
                        const cfg = tipoKardexConfig[k?.tipo] ?? { label: k?.tipo, variant: 'gray' as const };
                        return (
                          <tr key={k?.id} className="table-row-hover">
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                              {formatTimestamp(k?.timestamp)}
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-200 text-xs">{k?.product?.name}</p>
                              <p className="font-mono text-xxs text-gray-500">{k?.product?.sku}</p>
                            </td>
                            <td className="px-4 py-2.5 font-mono font-semibold text-gray-200">
                              {k?.cantidad}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-400">
                              {k?.user?.name}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
