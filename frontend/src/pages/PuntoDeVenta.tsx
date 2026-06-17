import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, productosApi, clientesApi, usuariosApi, transaccionesApi, ApiError } from '@/lib/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: string;
  globalStock: number;
}

interface Customer {
  id: string;
  companyName: string;
  creditLimit: string;
  currentDebt: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface CartItem {
  product: Product;
  cantidad: number;
  descuentoPorcentaje: number; // 0-100, ej. 10 = 10% descuento
  descuentoMonto: string;      // Monto fijo en string, ej. "50.00"
}

// ═════════════════════════════════════════════════════════════════════════════
// PUNTO DE VENTA — Split Screen
// ═════════════════════════════════════════════════════════════════════════════
export function PuntoDeVenta() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'VENTA_DIRECTA' | 'CREDITO'>('VENTA_DIRECTA');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); // Bloqueo síncrono para prevenir doble click
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Estados para descuentos (flexibilidad de precios B2B)
  const [discountType, setDiscountType] = useState<'PORCENTAJE' | 'MONTO' | null>(null);
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Aplicar descuento global al ticket con validación estricta
  const aplicarDescuentoGlobal = (): boolean => {
    setDiscountError(null);

    if (!discountType || !discountValue || discountValue.trim() === '') {
      setDiscountError('Ingresa un valor de descuento');
      return false;
    }

    if (discountType === 'PORCENTAJE') {
      const pct = parseFloat(discountValue);
      if (isNaN(pct) || pct < 0) {
        setDiscountError('El porcentaje debe ser un número válido ≥ 0');
        return false;
      }
      if (pct > 100) {
        setDiscountError('El descuento no puede superar el 100% (precio negativo no permitido)');
        return false;
      }
      setCart(prev => prev.map(item => ({ ...item, descuentoPorcentaje: pct, descuentoMonto: '0.00' })));
      return true;
    }

    if (discountType === 'MONTO') {
      const montoCents = stringToCents(discountValue);
      const totalCents = cart.reduce((sum, i) => sum + stringToCents(i.product.price) * i.cantidad, 0);

      if (montoCents <= 0) {
        setDiscountError('El monto de descuento debe ser mayor a 0');
        return false;
      }
      if (montoCents > totalCents) {
        setDiscountError('El descuento no puede ser mayor al total del ticket');
        return false;
      }

      // Distribuir descuento proporcionalmente entre items
      setCart(prev => {
        const totalCentsPrev = prev.reduce((sum, i) => sum + stringToCents(i.product.price) * i.cantidad, 0);
        if (totalCentsPrev === 0) return prev;

        let descuentoRestante = montoCents;
        return prev.map((item, idx) => {
          const itemCents = stringToCents(item.product.price) * item.cantidad;
          if (idx === prev.length - 1) {
            // Último item: asignar el resto para cuadrar exacto
            const asignado = descuentoRestante > itemCents ? itemCents : descuentoRestante;
            descuentoRestante -= asignado;
            return { ...item, descuentoPorcentaje: 0, descuentoMonto: centsToString(asignado) };
          }
          const proporcion = itemCents / totalCentsPrev;
          const asignado = Math.round(montoCents * proporcion);
          const ajustado = asignado > itemCents ? itemCents : asignado;
          descuentoRestante -= ajustado;
          return { ...item, descuentoPorcentaje: 0, descuentoMonto: centsToString(ajustado) };
        });
      });
      return true;
    }

    return false;
  };

  // Limpiar descuentos
  const limpiarDescuentos = () => {
    setCart(prev => prev.map(item => ({ ...item, descuentoPorcentaje: 0, descuentoMonto: '0.00' })));
    setDiscountType(null);
    setDiscountValue('');
    setDiscountError(null);
  };
  const [success, setSuccess] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cargar datos iniciales — [] estricto
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [pRes, cRes, uRes] = await Promise.all([
          productosApi.listar() as any,
          clientesApi.listar() as any,
          usuariosApi.vendedores() as any,
        ]);
        if (!cancelled) {
          setProducts(pRes.data ?? []);
          setCustomers(cRes.data ?? []);
          setUsers(uRes.data ?? []);
          if ((uRes.data ?? []).length > 0) setSelectedUser(uRes.data[0]);
        }
      } catch (err) {
        if (!cancelled)
          setDataError(err instanceof ApiError ? err.message : 'Error al cargar datos');
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, search]);

  // ── Cart operations ──────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, product.globalStock) }
            : i
        );
      }
      return [...prev, { product, cantidad: 1, descuentoPorcentaje: 0, descuentoMonto: '0.00' }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, cantidad: Math.max(0, i.cantidad + delta) }
            : i
        )
        .filter((i) => i.cantidad > 0)
    );
  };

  const removeItem = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES DE PRECISIÓN FINANCIERA (REGLA DE LOS CENTAVOS)
  // Todo cálculo monetario usa enteros (centavos) para evitar floating point
  // ═══════════════════════════════════════════════════════════════════════════
  const stringToCents = (value: string): number => {
    if (!value || value === '') return 0;
    const trimmed = value.trim();
    const sign = trimmed.startsWith('-') ? -1 : 1;
    const abs = sign === -1 ? trimmed.slice(1) : trimmed;
    const parts = abs.split('.');
    const integer = parseInt(parts[0] || '0', 10);
    let decimal = 0;
    if (parts.length > 1 && parts[1]) {
      const decStr = parts[1].padEnd(2, '0').slice(0, 2);
      decimal = parseInt(decStr, 10);
    }
    return sign * (integer * 100 + decimal);
  };

  const centsToString = (cents: number): string => {
    const isNegative = cents < 0;
    const abs = Math.abs(cents);
    const integer = Math.floor(abs / 100);
    const decimal = abs % 100;
    return `${isNegative ? '-' : ''}${integer}.${decimal.toString().padStart(2, '0')}`;
  };

  // Total del ticket — PRECISIÓN EXACTA con enteros (centavos)
  const totalDisplayCents = cart.reduce((sum, item) => {
    const precioCents = stringToCents(item.product.price);
    const subtotalCents = precioCents * item.cantidad;
    let descuentoCents = 0;
    if (item.descuentoPorcentaje > 0) {
      descuentoCents = Math.round(subtotalCents * (item.descuentoPorcentaje / 100));
    } else if (item.descuentoMonto && item.descuentoMonto !== '0.00') {
      descuentoCents = stringToCents(item.descuentoMonto);
    }
    const finalCents = subtotalCents - descuentoCents;
    return sum + (finalCents > 0 ? finalCents : 0); // REGLA DE ORO: Nunca negativo
  }, 0);

  const totalDisplay = centsToString(totalDisplayCents);
  const totalDisplayNumber = totalDisplayCents / 100; // Para formatCurrency si requiere número

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleCobrar = async () => {
    // Bloqueo síncrono inmediato (no depende de estado asíncrono)
    if (submittingRef.current) return;
    if (!selectedCustomer || !selectedUser || cart.length === 0) return;

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // PRECISIÓN FINANCIERA: precioAplicado desde fuente original (DB)
      // EL TOTAL NO SE ENVÍA: Backend recalcula soberanamente para evitar manipulación
      const items = cart.map((i) => ({
        productId: i.product.id,
        cantidad: i.cantidad,
        precioAplicado: i.product.price.toString().trim(),
        descuentoPorcentaje: i.descuentoPorcentaje ?? 0,
        descuentoMonto: i.descuentoMonto ?? '0.00',
      }));

      await transaccionesApi.registrar({
        tipo: paymentType,
        customerId: selectedCustomer.id,
        userId: selectedUser.id,
        items,
      });

      setSuccess(true);
      setCart([]);
      setPaymentModal(false);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Error al procesar venta');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const resetPos = () => {
    setSuccess(false);
    setSelectedCustomer(null);
    setCart([]);
    setSearch('');
    searchRef.current?.focus();
  };

  if (loadingData) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-hc-cobalt-light" />
        <span className="text-sm text-gray-400">Cargando módulo POS...</span>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3">
        <AlertTriangle className="h-6 w-6 text-hc-coral" />
        <p className="text-sm text-hc-coral">{dataError}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Punto de Venta</h1>
        <p className="mt-1 text-sm text-gray-500">POS · Registro de ventas directas y a crédito</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ═══ LEFT — Buscador de productos ═══ */}
        <div className="xl:col-span-7 space-y-4">
          {/* Selectores */}
          <div className="card grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-400">Vendedor</p>
              <select
                className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                value={selectedUser?.id ?? ''}
                onChange={(e) => setSelectedUser(users.find((u) => u.id === e.target.value) ?? null)}
              >
                {(users || []).map((u) => (
                  <option key={u?.id} value={u?.id}>{u?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-400">Cliente</p>
              <select
                className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                value={selectedCustomer?.id ?? ''}
                onChange={(e) =>
                  setSelectedCustomer(customers.find((c) => c.id === e.target.value) ?? null)
                }
              >
                <option value="">— Seleccionar cliente —</option>
                {(customers || []).map((c) => (
                  <option key={c?.id} value={c?.id}>{c?.companyName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buscador de productos */}
          <div className="card p-0">
            <div className="px-4 py-3 border-b border-gray-700/40">
              <Input
                label=""
                placeholder="Buscar producto o SKU..."
                icon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-700/30">
              {(filteredProducts || []).length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-500">Sin productos</p>
                </div>
              ) : (
                (filteredProducts || []).map((p) => (
                  <button
                    key={p?.id}
                    onClick={() => addToCart(p)}
                    disabled={p?.globalStock === 0}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-hc-surface-dark/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-hc-cobalt/10">
                      <Package className="h-4 w-4 text-hc-cobalt-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-200 truncate">{p?.name}</p>
                      <p className="font-mono text-xxs text-gray-500">{p?.sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono font-semibold text-hc-emerald">
                        {formatCurrency(p?.price)}
                      </p>
                      <p className="text-xxs text-gray-500">{p?.globalStock} uds</p>
                    </div>
                    <Plus className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT — Ticket ═══ */}
        <div className="xl:col-span-5 space-y-4">
          <div className="card p-0">
            <div className="flex items-center justify-between border-b border-gray-700/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-hc-cobalt-light" />
                <h2 className="text-sm font-semibold text-gray-200">Ticket</h2>
              </div>
              <Badge variant="cobalt" size="sm">{cart.length} items</Badge>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <CheckCircle2 className="h-14 w-14 text-hc-emerald mb-4" />
                <p className="text-lg font-bold text-hc-emerald">¡Venta registrada!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Transacción completada exitosamente
                </p>
                <Button variant="primary" size="md" className="mt-5" onClick={resetPos}>
                  Nueva venta
                </Button>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <ShoppingCart className="h-10 w-10 text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">Agrega productos al ticket</p>
              </div>
            ) : (
              <>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-700/30">
                  {(cart || []).map((item) => (
                    <div key={item?.product?.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {item?.product?.name}
                        </p>
                        <p className="text-xxs font-mono text-gray-500">
                          {formatCurrency(item?.product?.price)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item?.product?.id, -1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:bg-hc-surface-dark hover:text-gray-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-mono font-semibold text-gray-200">
                          {item?.cantidad}
                        </span>
                        <button
                          onClick={() => updateQty(item?.product?.id, 1)}
                          disabled={item?.cantidad >= (item?.product?.globalStock ?? 0)}
                          className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:bg-hc-surface-dark hover:text-gray-200 disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="w-20 text-right font-mono text-sm font-semibold text-hc-emerald">
                        {formatCurrency(Number(item?.product?.price || 0) * (item?.cantidad || 0))}
                      </span>
                      <button
                        onClick={() => removeItem(item?.product?.id)}
                        className="text-gray-500 hover:text-hc-coral"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* ── Sección de Descuentos ──────────────────────────────── */}
                <div className="px-5 py-3 border-t border-gray-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => { setDiscountType('PORCENTAJE'); setDiscountValue(''); setDiscountError(null); }}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                        discountType === 'PORCENTAJE'
                          ? 'bg-hc-cobalt/20 text-hc-cobalt-light border border-hc-cobalt/40'
                          : 'bg-hc-surface-dark text-gray-400 border border-gray-700/30 hover:border-gray-500'
                      }`}
                    >
                      Descuento %
                    </button>
                    <button
                      onClick={() => { setDiscountType('MONTO'); setDiscountValue(''); setDiscountError(null); }}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                        discountType === 'MONTO'
                          ? 'bg-hc-cobalt/20 text-hc-cobalt-light border border-hc-cobalt/40'
                          : 'bg-hc-surface-dark text-gray-400 border border-gray-700/30 hover:border-gray-500'
                      }`}
                    >
                      Descuento $
                    </button>
                    {discountType && (
                      <button
                        onClick={limpiarDescuentos}
                        className="text-xs text-gray-500 hover:text-hc-coral ml-auto"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {discountType && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={discountType === 'PORCENTAJE' ? 'Ej. 10' : 'Ej. 50.00'}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-1.5 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none font-mono"
                      />
                      <button
                        onClick={aplicarDescuentoGlobal}
                        className="px-3 py-1.5 rounded-lg bg-hc-cobalt text-white text-xs font-medium hover:bg-hc-cobalt-light transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}

                  {discountError && (
                    <p className="mt-1.5 text-xxs text-hc-coral">{discountError}</p>
                  )}

                  {cart.some(i => i.descuentoPorcentaje > 0 || (i.descuentoMonto && i.descuentoMonto !== '0.00')) && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-hc-emerald/5 px-3 py-2 border border-hc-emerald/20">
                      <span className="text-xs text-hc-emerald">Descuento aplicado</span>
                      <span className="text-xs font-mono font-bold text-hc-emerald">
                        -{centsToString(cart.reduce((sum, i) => {
                          const pc = stringToCents(i.product.price) * i.cantidad;
                          let dc = 0;
                          if (i.descuentoPorcentaje > 0) dc = Math.round(pc * (i.descuentoPorcentaje / 100));
                          else if (i.descuentoMonto && i.descuentoMonto !== '0.00') dc = stringToCents(i.descuentoMonto);
                          return sum + (dc > 0 ? dc : 0);
                        }, 0))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700/40 px-5 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">Total</span>
                    <span className="text-2xl font-bold font-mono text-gray-100">
                      {formatCurrency(totalDisplay)}
                    </span>
                  </div>

                  {submitError && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-3 py-2">
                      <AlertTriangle className="h-4 w-4 text-hc-coral flex-shrink-0" />
                      <p className="text-xs text-hc-coral">{submitError}</p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={DollarSign}
                    disabled={!selectedCustomer || !selectedUser}
                    onClick={() => setPaymentModal(true)}
                  >
                    Cobrar {formatCurrency(totalDisplay)}
                  </Button>
                  {!selectedCustomer && (
                    <p className="mt-2 text-center text-xxs text-amber-400">
                      Selecciona un cliente para continuar
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de método de pago ──────────────────────────────────── */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-gray-700/50 bg-hc-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-100">Método de Pago</h2>
              <button onClick={() => setPaymentModal(false)} className="text-gray-400 hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => setPaymentType('VENTA_DIRECTA')}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  paymentType === 'VENTA_DIRECTA'
                    ? 'border-hc-emerald/50 bg-hc-emerald/10'
                    : 'border-gray-700/40 bg-hc-surface-dark hover:border-gray-600'
                }`}
              >
                <DollarSign className={`h-5 w-5 ${paymentType === 'VENTA_DIRECTA' ? 'text-hc-emerald' : 'text-gray-500'}`} />
                <div>
                  <p className="font-medium text-gray-200">Efectivo / Transferencia</p>
                  <p className="text-xxs text-gray-500">Pago inmediato — sin deuda</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentType('CREDITO')}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  paymentType === 'CREDITO'
                    ? 'border-hc-cobalt/50 bg-hc-cobalt/10'
                    : 'border-gray-700/40 bg-hc-surface-dark hover:border-gray-600'
                }`}
              >
                <CreditCard className={`h-5 w-5 ${paymentType === 'CREDITO' ? 'text-hc-cobalt-light' : 'text-gray-500'}`} />
                <div>
                  <p className="font-medium text-gray-200">Crédito B2B</p>
                  <p className="text-xxs text-gray-500">Suma a la deuda del cliente</p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between mb-5 rounded-lg bg-hc-surface-dark px-4 py-3">
              <span className="text-sm text-gray-400">Total a cobrar</span>
              <span className="font-mono font-bold text-gray-100">
                {formatCurrency(totalDisplay)}
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" size="md" fullWidth onClick={() => setPaymentModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={submitting}
                onClick={handleCobrar}
              >
                Confirmar venta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
