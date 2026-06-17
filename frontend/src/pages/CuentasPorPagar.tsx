import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, comprasApi, inventarioApi, usuariosApi, productosApi, ApiError } from '@/lib/api';

interface Supplier {
  id: string;
  name: string;
  rfc: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  cost: string; // Se usará como default
}

interface PurchaseOrder {
  id: string;
  status: 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';
  totalAmount: string;
  createdAt: string;
  receivedAt?: string;
  supplier: { id: string; name: string };
  _count: { items: number };
}

interface InventoryLocation {
  id: string;
  name: string;
  tipo: string;
}

interface User {
  id: string;
  name: string;
}

// ═════════════════════════════════════════════════════════════════════════════
export function CuentasPorPagar() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Crear OC
  const [createModal, setCreateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cart, setCart] = useState<Array<{ product: Product; qty: string; cost: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [notes, setNotes] = useState('');

  // Modal Recibir
  const [receiveModal, setReceiveModal] = useState<string | null>(null); // orderId
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [oRes, sRes, pRes, lRes, uRes] = await Promise.all([
        comprasApi.listar() as any,
        comprasApi.proveedores() as any,
        productosApi.listar() as any,
        inventarioApi.almacenes() as any,
        usuariosApi.vendedores() as any,
      ]);
      setOrders(oRes.data ?? []);
      setSuppliers(sRes.data ?? []);
      setProducts(pRes.data ?? []);
      setLocations(lRes.data ?? []);
      setUsers(uRes.data ?? []);
      if ((uRes.data ?? []).length > 0) setSelectedUser(uRes.data[0].id);
      if ((lRes.data ?? []).length > 0) setSelectedLocation(lRes.data[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    const p = products.find((x) => x.id === selectedProduct);
    if (!p) return;
    if (cart.find((c) => c.product.id === p.id)) return; // Ya está

    setCart([...cart, { product: p, qty: '1', cost: p.cost }]);
    setSelectedProduct('');
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const q = parseInt(item.qty, 10) || 0;
      const c = parseFloat(item.cost) || 0;
      return sum + q * c;
    }, 0);
  }, [cart]);

  const handleCreateOrder = async () => {
    if (!selectedSupplier || cart.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const items = cart.map((c) => ({
        productId: c.product.id,
        cantidad: parseInt(c.qty, 10) || 1,
        costUnit: parseFloat(c.cost).toString().trim(),
      }));

      await comprasApi.crear({
        supplierId: selectedSupplier,
        notes: notes.trim() || undefined,
        items,
      });

      setSuccessMsg('Orden de compra creada exitosamente');
      setCreateModal(false);
      setCart([]);
      setSelectedSupplier('');
      setNotes('');
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Error al crear OC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async () => {
    if (!receiveModal || !selectedLocation || !selectedUser) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await comprasApi.recibir(receiveModal, {
        locationId: selectedLocation,
        userId: selectedUser,
        notes: 'Recepción desde UI',
      });

      setSuccessMsg('Mercancía recibida e inventario actualizado');
      setReceiveModal(null);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Error al recibir mercancía');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Cuentas por Pagar</h1>
          <p className="mt-1 text-sm text-gray-500">CxP · Órdenes de compra y recepción de inventario</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => setCreateModal(true)}>
          Nueva Orden (OC)
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-hc-emerald/30 bg-hc-emerald/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-hc-emerald" />
          <p className="text-sm font-medium text-hc-emerald">{successMsg}</p>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-hc-surface-dark" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-hc-coral" />
            <p className="text-sm text-hc-coral">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/40 bg-hc-surface-dark">
                  {['Fecha', 'Proveedor', 'Total', 'Artículos', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {(orders || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                      <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                      Sin órdenes de compra registradas
                    </td>
                  </tr>
                ) : (
                  (orders || []).map((o) => (
                    <tr key={o?.id} className="table-row-hover">
                      <td className="px-5 py-3 text-xs text-gray-400">{formatDate(o?.createdAt)}</td>
                      <td className="px-5 py-3 font-medium text-gray-200">{o?.supplier?.name}</td>
                      <td className="px-5 py-3 font-mono font-semibold text-hc-cobalt-light">
                        {formatCurrency(o?.totalAmount)}
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-300">{o?._count?.items} líneas</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={o?.status === 'RECIBIDA' ? 'emerald' : o?.status === 'PENDIENTE' ? 'amber' : 'coral'}
                          size="sm"
                        >
                          {o?.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        {o?.status === 'PENDIENTE' && (
                          <Button variant="ghost" size="sm" icon={Truck} onClick={() => setReceiveModal(o?.id)}>
                            Recibir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear OC */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-700/50 bg-hc-surface shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-700/40 px-6 py-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-100">Nueva Orden de Compra</h2>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Proveedor *</label>
                <select
                  className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">— Seleccionar —</option>
                  {(suppliers || []).map((s) => (
                    <option key={s?.id} value={s?.id}>{s?.name} (RFC: {s?.rfc})</option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-gray-700/40 bg-hc-surface-dark p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Artículos
                </p>
                <div className="flex gap-2 mb-4">
                  <select
                    className="flex-1 rounded-lg border border-gray-700/50 bg-hc-surface px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">— Agregar producto —</option>
                    {(products || []).map((p) => (
                      <option key={p?.id} value={p?.id}>{p?.sku} · {p?.name}</option>
                    ))}
                  </select>
                  <Button variant="secondary" size="md" onClick={handleAddProduct} disabled={!selectedProduct}>
                    Añadir
                  </Button>
                </div>

                <div className="space-y-2">
                  {(cart || []).map((c, i) => (
                    <div key={c?.product?.id} className="flex items-center gap-3 bg-hc-surface px-3 py-2 rounded-lg border border-gray-700/30">
                      <span className="flex-1 text-sm text-gray-200 truncate">{c?.product?.name}</span>
                      <input
                        type="number"
                        min="1"
                        className="w-20 rounded border border-gray-700/50 bg-hc-surface-dark px-2 py-1 text-sm text-center focus:border-hc-cobalt focus:outline-none"
                        value={c.qty}
                        onChange={(e) => setCart(cart.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))}
                        placeholder="Cant."
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-24 rounded border border-gray-700/50 bg-hc-surface-dark px-2 py-1 text-sm text-right focus:border-hc-cobalt focus:outline-none font-mono"
                        value={c.cost}
                        onChange={(e) => setCart(cart.map((x, j) => j === i ? { ...x, cost: e.target.value } : x))}
                        placeholder="Costo"
                      />
                      <button
                        onClick={() => setCart(cart.filter((_, j) => j !== i))}
                        className="text-gray-500 hover:text-hc-coral p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {(cart || []).length === 0 && (
                    <p className="text-center text-xs text-gray-500 py-2">No hay artículos en la orden</p>
                  )}
                </div>
                
                {cart.length > 0 && (
                  <div className="mt-4 flex justify-between items-center border-t border-gray-700/40 pt-3">
                    <span className="text-sm text-gray-400">Total Estimado</span>
                    <span className="font-mono font-bold text-hc-emerald text-lg">{formatCurrency(cartTotal)}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
            </div>

            <div className="border-t border-gray-700/40 px-6 py-4 flex gap-3 flex-shrink-0">
              <Button variant="ghost" size="md" fullWidth onClick={() => setCreateModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={submitting}
                disabled={!selectedSupplier || cart.length === 0}
                onClick={handleCreateOrder}
              >
                Generar Orden
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recibir Mercancía */}
      {receiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-700/50 bg-hc-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-100">Recibir Mercancía</h2>
              <button onClick={() => setReceiveModal(null)} className="text-gray-400 hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-5">
              Se actualizará el stock y se registrará la entrada en el Kardex.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Almacén Destino *</label>
                <select
                  className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {(locations || []).map((l) => (
                    <option key={l?.id} value={l?.id}>{l?.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Responsable (Recepción) *</label>
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

              {submitError && (
                <div className="flex items-center gap-2 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-hc-coral flex-shrink-0" />
                  <p className="text-xs text-hc-coral">{submitError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" size="md" fullWidth onClick={() => setReceiveModal(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={Truck}
                loading={submitting}
                disabled={!selectedLocation || !selectedUser}
                onClick={handleReceive}
              >
                Confirmar Ingreso
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
