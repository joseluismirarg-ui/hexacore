import React, { useState, useMemo } from 'react';
import {
  Search,
  Truck,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Package,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { useVendedores, useCamiones, useLiquidacion } from '@/lib/hooks';
import { formatCurrency, api } from '@/lib/api';
import type { User, InventoryLocation } from '@/types/models';

// ═════════════════════════════════════════════════════════════════════════════
// LIQUIDACIÓN PAGE — Split Screen
// REFACTORIZADO:
//   - payload financiero usa .toString().trim() — PROHIBIDO parseFloat/parseInt
//   - estados isLoading + error en vendedores y camiones
//   - conciliación en UI usa Number() solo para cálculo de display, el payload
//     enviado al backend viaja siempre como string
// ═════════════════════════════════════════════════════════════════════════════

// ── Skeleton de lista ────────────────────────────────────────────────────────
function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-[56px] animate-pulse rounded-lg bg-hc-surface-dark"
        />
      ))}
    </div>
  );
}

// ── Error inline ─────────────────────────────────────────────────────────────
function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-hc-coral" />
      <p className="text-xs text-hc-coral">{message}</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════

export function Liquidacion() {
  const {
    data: vendedores,
    loading: loadingVendedores,
    error: errorVendedores,
  } = useVendedores();

  const {
    data: camiones,
    loading: loadingCamiones,
    error: errorCamiones,
  } = useCamiones();

  const [selectedVendedor, setSelectedVendedor] = useState<User | null>(null);
  const [selectedCamion, setSelectedCamion] = useState<InventoryLocation | null>(null);
  const [searchVendedor, setSearchVendedor] = useState('');
  const [efectivoEntregado, setEfectivoEntregado] = useState('');
  // devueltos: las cantidades permanecen como strings — se convierten solo
  // para cálculos de display en el useMemo, NUNCA para el payload del backend.
  const [devueltos, setDevueltos] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

  const {
    data: liquidacion,
    loading: loadingLiquidacion,
    error: errorLiquidacion,
  } = useLiquidacion(selectedCamion?.id);

  // ── Filtro de vendedores ───────────────────────────────────────────────────
  const filteredVendedores = useMemo(() => {
    if (!vendedores) return [];
    if (!searchVendedor) return vendedores;
    const q = searchVendedor.toLowerCase();
    return vendedores.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
    );
  }, [vendedores, searchVendedor]);

  // ── Cálculos de conciliación (solo para DISPLAY en UI) ────────────────────
  // NOTA: Number() se usa aquí únicamente para renderizar valores en pantalla.
  // Los datos financieros que viajan al backend se envían siempre como string.
  const conciliacion = useMemo(() => {
    if (!liquidacion) return null;

    const productos = liquidacion.productos.map((p) => {
      // Conversión a number SOLO para aritmética de UI/display
      const devueltoReal = Math.max(0, Number(devueltos[p.product.id] ?? 0));
      const vendidoReal = Math.max(0, p.cargado - devueltoReal);
      const precioNum = Number(p.product.price);
      const montoReal = vendidoReal * precioNum;
      return { ...p, devueltoReal, vendidoReal, montoReal };
    });

    const totalEsperado = productos.reduce((s, p) => s + p.montoEsperado, 0);
    const totalReal = productos.reduce((s, p) => s + p.montoReal, 0);
    const efectivoNum = Number(efectivoEntregado) || 0;
    const discrepanciaStock = totalReal - totalEsperado;
    const discrepanciaEfectivo = efectivoNum - totalReal;

    return {
      productos,
      totalEsperado,
      totalReal,
      efectivo: efectivoNum,
      discrepanciaStock,
      discrepanciaEfectivo,
    };
  }, [liquidacion, devueltos, efectivoEntregado]);

  // ── Cerrar caja ───────────────────────────────────────────────────────────
  // LEY INQUEBRANTABLE DE PRECISIÓN FINANCIERA:
  // Todos los campos monetarios que viajan al backend se serializan como
  // string puro (.toString().trim()). Se delega al backend (decimal.js) la
  // precisión decimal. NUNCA se usa parseFloat/parseInt en el payload.
  const handleCerrarCaja = async () => {
    if (!selectedVendedor || !selectedCamion || !conciliacion) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setErrorSubmit(null);

    try {
      const items = conciliacion.productos
        .filter((p) => p.vendidoReal > 0)
        .map((p) => ({
          productId: p.product.id,
          cantidad: p.vendidoReal,
          // precioAplicado llega del backend como string Decimal — se reenvía
          // como string sin transformación numérica para preservar precisión.
          precioAplicado: p.product.price.toString().trim(),
        }));

      // total: tomamos el valor calculado de display con 2 decimales y lo
      // representamos como string para que el backend lo procese con Decimal.
      const totalStr = conciliacion.totalReal.toFixed(2).toString().trim();

      const payload = {
        tipo: 'VENTA_DIRECTA',
        customerId: 'customer_placeholder',
        userId: selectedVendedor.id,
        locationId: selectedCamion.id,
        total: totalStr,
        items,
      };

      await api.post('/api/v1/transacciones/registrar', payload);
      setSubmitSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al procesar la transacción';
      setErrorSubmit(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Liquidación de Vendedores</h1>
        <p className="mt-1 text-sm text-gray-500">
          Conciliación de efectivo, stock devuelto y cierre de caja diaria
        </p>
      </div>

      {/* ── Split Screen Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

        {/* ═══════════════════════════════════════════════════════════
            LEFT PANEL — Selección de Vendedor y Camión (5/12)
            ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-4 xl:col-span-5">

          {/* Búsqueda de vendedores */}
          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
              <UserIcon className="h-4 w-4 text-hc-cobalt-light" />
              Seleccionar Vendedor de Ruta
            </h2>
            <Input
              label=""
              placeholder="Buscar por nombre o correo..."
              icon={<Search className="h-4 w-4" />}
              value={searchVendedor}
              onChange={(e) => setSearchVendedor(e.target.value)}
            />
            <div className="mt-3 space-y-2">
              {/* Estado de carga */}
              {loadingVendedores && <ListSkeleton rows={3} />}

              {/* Estado de error */}
              {!loadingVendedores && errorVendedores && (
                <InlineError message={`No se pudieron cargar los vendedores: ${errorVendedores}`} />
              )}

              {/* Estado vacío o sin resultados */}
              {!loadingVendedores && !errorVendedores && filteredVendedores.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">
                  {searchVendedor ? 'Sin coincidencias' : 'Sin vendedores disponibles'}
                </p>
              )}

              {/* Lista de vendedores */}
              {!loadingVendedores &&
                !errorVendedores &&
                filteredVendedores.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVendedor(v)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                      selectedVendedor?.id === v.id
                        ? 'border-hc-cobalt/50 bg-hc-cobalt/10 shadow-sm'
                        : 'border-gray-700/40 bg-hc-surface-dark hover:border-gray-600 hover:bg-hc-surface-light/30'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        selectedVendedor?.id === v.id
                          ? 'bg-hc-cobalt/25 text-hc-cobalt-light'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {v.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-100">{v.name}</p>
                      <p className="truncate text-xs text-gray-500">{v.email}</p>
                    </div>
                    <Badge variant={selectedVendedor?.id === v.id ? 'cobalt' : 'gray'} size="sm">
                      {v.role === 'VENDEDOR_RUTA' ? 'Ruta' : 'Admin'}
                    </Badge>
                  </button>
                ))}
            </div>
          </div>

          {/* Selección de camión */}
          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
              <Truck className="h-4 w-4 text-hc-cobalt-light" />
              Folio de Camión Móvil
            </h2>
            <div className="space-y-2">
              {/* Estado de carga */}
              {loadingCamiones && <ListSkeleton rows={2} />}

              {/* Estado de error */}
              {!loadingCamiones && errorCamiones && (
                <InlineError message={`No se pudieron cargar los camiones: ${errorCamiones}`} />
              )}

              {/* Lista de camiones */}
              {!loadingCamiones &&
                !errorCamiones &&
                (camiones ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCamion(c);
                      // Limpiar devueltos al cambiar de camión para evitar
                      // contaminación de estado entre liquidaciones.
                      setDevueltos({});
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                      selectedCamion?.id === c.id
                        ? 'border-hc-cobalt/50 bg-hc-cobalt/10'
                        : 'border-gray-700/40 bg-hc-surface-dark hover:border-gray-600'
                    }`}
                  >
                    <Truck
                      className={`h-5 w-5 flex-shrink-0 ${
                        selectedCamion?.id === c.id ? 'text-hc-cobalt-light' : 'text-gray-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">{c.name}</p>
                      <p className="font-mono text-xxs text-gray-500">{c.id}</p>
                    </div>
                    {selectedCamion?.id === c.id && (
                      <StatusDot status="active" label="Seleccionado" />
                    )}
                  </button>
                ))}

              {!loadingCamiones && !errorCamiones && (camiones ?? []).length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">
                  Sin camiones registrados
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT PANEL — Formulario de Conciliación (7/12)
            ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-4 xl:col-span-7">
          {/* Header de contexto */}
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Conciliando</p>
              <p className="text-lg font-semibold text-gray-100">
                {selectedVendedor?.name ?? 'Selecciona un vendedor'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-500">Camión</p>
              <p className="text-sm font-medium text-gray-300">
                {selectedCamion?.name ?? '—'}
              </p>
            </div>
          </div>

          {/* Tabla de stock devuelto */}
          <div className="card p-0">
            <div className="border-b border-gray-700/40 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <ArrowRightLeft className="h-4 w-4 text-hc-cobalt-light" />
                Conciliación de Productos
              </h3>
            </div>

            {/* Estado: sin camión seleccionado */}
            {!selectedCamion && (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-sm text-gray-500">
                  Selecciona un camión para ver los productos
                </p>
              </div>
            )}

            {/* Estado: cargando liquidación */}
            {selectedCamion && loadingLiquidacion && (
              <div className="flex h-[200px] items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-hc-cobalt-light" />
                <span className="text-sm text-gray-400">Sincronizando datos...</span>
              </div>
            )}

            {/* Estado: error al cargar liquidación */}
            {selectedCamion && !loadingLiquidacion && errorLiquidacion && (
              <div className="p-5">
                <InlineError
                  message={`No se pudo cargar la liquidación: ${errorLiquidacion}`}
                />
              </div>
            )}

            {/* Tabla de productos */}
            {selectedCamion && !loadingLiquidacion && !errorLiquidacion && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/40 bg-hc-surface-dark">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Producto
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Cargado
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-hc-cobalt-light">
                        Devuelto
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Vendido
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Esperado
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Real
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {conciliacion?.productos.map((p) => {
                      const diff = p.montoReal - p.montoEsperado;
                      return (
                        <tr key={p.product.id} className="table-row-hover">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 flex-shrink-0 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-200">{p.product.name}</p>
                                <p className="font-mono text-xxs text-gray-500">{p.product.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-300">
                            {p.cargado}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={p.cargado}
                              value={devueltos[p.product.id] ?? ''}
                              placeholder={String(p.devuelto)}
                              onChange={(e) =>
                                setDevueltos((prev) => ({
                                  ...prev,
                                  [p.product.id]: e.target.value,
                                }))
                              }
                              className="w-16 rounded border border-gray-600 bg-hc-surface-dark px-2 py-1 text-center font-mono text-sm text-hc-cobalt-light focus:border-hc-cobalt focus:outline-none focus:ring-1 focus:ring-hc-cobalt"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-300">
                            {p.vendidoReal}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-gray-400">
                            {formatCurrency(p.montoEsperado)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span
                              className={`font-mono font-semibold ${
                                Math.abs(diff) > 0.01
                                  ? diff > 0
                                    ? 'text-hc-emerald'
                                    : 'text-hc-coral'
                                  : 'text-gray-300'
                              }`}
                            >
                              {formatCurrency(p.montoReal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Sin productos */}
                    {!conciliacion?.productos.length && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          Sin productos en este camión
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Efectivo entregado */}
          <div className="card">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Efectivo Entregado"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                icon={<DollarSign className="h-4 w-4" />}
                value={efectivoEntregado}
                onChange={(e) => setEfectivoEntregado(e.target.value)}
              />
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Total Esperado
                </p>
                <p className="rounded-lg border border-gray-700/40 bg-hc-surface-dark px-3 py-2 font-mono text-sm font-semibold text-gray-200">
                  {formatCurrency(conciliacion?.totalEsperado ?? 0)}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Discrepancia
                </p>
                <p
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm font-bold ${
                    (conciliacion?.discrepanciaEfectivo ?? 0) >= 0
                      ? 'border-hc-emerald/30 bg-hc-emerald/5 text-hc-emerald'
                      : 'border-hc-coral/30 bg-hc-coral/5 text-hc-coral'
                  }`}
                >
                  {(conciliacion?.discrepanciaEfectivo ?? 0) >= 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {formatCurrency(Math.abs(conciliacion?.discrepanciaEfectivo ?? 0))}
                  {(conciliacion?.discrepanciaEfectivo ?? 0) < 0 && (
                    <span className="text-xxs font-normal">faltante</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── CTA BUTTON ───────────────────────────────────────── */}
          <Button
            variant="primary"
            size="xl"
            fullWidth
            icon={CheckCircle2}
            onClick={handleCerrarCaja}
            disabled={
              !selectedVendedor ||
              !selectedCamion ||
              loadingLiquidacion ||
              isSubmitting
            }
            loading={isSubmitting}
          >
            {isSubmitting ? 'PROCESANDO...' : 'CERRAR CAJA DIARIA Y LIBERAR RUTA'}
          </Button>

          {/* Error de submit */}
          {errorSubmit && (
            <div className="animate-slide-in rounded-lg border border-hc-coral/30 bg-hc-coral/5 p-4 text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-hc-coral" />
              <p className="text-sm font-semibold text-hc-coral">Error de Validación</p>
              <p className="text-xs text-gray-400">{errorSubmit}</p>
            </div>
          )}

          {/* Confirmación de éxito */}
          {submitSuccess && !errorSubmit && (
            <div className="animate-slide-in rounded-lg border border-hc-emerald/30 bg-hc-emerald/5 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-hc-emerald" />
              <p className="text-sm font-semibold text-hc-emerald">
                Caja cerrada exitosamente
              </p>
              <p className="text-xs text-gray-400">
                Ruta {selectedCamion?.name} liberada para {selectedVendedor?.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
