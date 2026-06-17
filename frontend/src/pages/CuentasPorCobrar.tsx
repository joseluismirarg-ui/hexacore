import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Loader2,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, cobranzaApi, ApiError } from '@/lib/api';

interface CustomerDebt {
  id: string;
  companyName: string;
  creditLimit: string;
  currentDebt: string;
}

const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA', label: 'Tarjeta' },
] as const;

// ═════════════════════════════════════════════════════════════════════════════
export function CuentasPorCobrar() {
  const [customers, setCustomers] = useState<CustomerDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA'>('EFECTIVO');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newDebt, setNewDebt] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cobranzaApi.conDeuda() as any;
      console.log('💰 DATOS DE COBRANZA (VENTAS/DEUDAS) RECIBIDOS:', res.data);
      setCustomers(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar cartera');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]); // [] efectivo

  const handlePago = async () => {
    if (!selectedCustomer || !amount) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // PRECISIÓN FINANCIERA: amount viaja como string.toString().trim()
      const res = await cobranzaApi.abonar({
        customerId: selectedCustomer.id,
        monto: amount.toString().trim(),
        userId: 'admin_placeholder', // En producción: ID del usuario autenticado
        notas: notes.trim() || undefined,
      }) as any;

      setSubmitSuccess(true);
      setNewDebt(res.data?.deudaNueva ?? null);
      setAmount('');
      setNotes('');
      loadCustomers();
      setTimeout(() => {
        setSubmitSuccess(false);
        setNewDebt(null);
      }, 4000);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCartera = (customers || []).reduce((s, c) => s + Number(c?.currentDebt || 0), 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Cuentas por Cobrar</h1>
        <p className="mt-1 text-sm text-gray-500">Cobranza · Gestión de cartera vencida</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-hc-surface" />
          ))
        ) : (
          <>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-coral/10">
                <TrendingDown className="h-5 w-5 text-hc-coral" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Cartera total</p>
                <p className="text-xl font-bold text-hc-coral">{formatCurrency(totalCartera)}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Clientes con deuda</p>
                <p className="text-2xl font-bold text-amber-400">{(customers || []).length}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-cobalt/10">
                <DollarSign className="h-5 w-5 text-hc-cobalt-light" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Promedio deuda</p>
                <p className="text-xl font-bold text-hc-cobalt-light">
                  {(customers || []).length > 0 ? formatCurrency(totalCartera / (customers || []).length) : '$—'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ═══ LEFT — Lista de clientes con deuda ═══ */}
        <div className="xl:col-span-7">
          <div className="card p-0">
            <div className="px-5 py-3 border-b border-gray-700/40">
              <h2 className="text-sm font-semibold text-gray-200">Cartera Vencida</h2>
              <p className="text-xxs text-gray-500">Clientes ordenados por deuda descendente</p>
            </div>
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
            ) : (customers || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-hc-emerald mb-3" />
                <p className="text-sm font-semibold text-hc-emerald">Sin cartera vencida</p>
                <p className="text-xs text-gray-500 mt-1">Todos los clientes están al corriente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/30 max-h-[500px] overflow-y-auto">
                {(customers || []).map((c) => {
                  const pct =
                    Number(c?.creditLimit || 0) > 0
                      ? (Number(c?.currentDebt || 0) / Number(c?.creditLimit || 0)) * 100
                      : 0;
                  const isSelected = selectedCustomer?.id === c?.id;
                  return (
                    <button
                      key={c?.id}
                      onClick={() => { setSelectedCustomer(c); setAmount(''); setSubmitError(null); }}
                      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-all ${
                        isSelected
                          ? 'bg-hc-cobalt/10 border-l-2 border-hc-cobalt'
                          : 'hover:bg-hc-surface-dark/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-200 truncate">{c?.companyName}</p>
                        <p className="text-xs text-gray-500">
                          Límite: {formatCurrency(c?.creditLimit)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-hc-coral">
                          {formatCurrency(c?.currentDebt)}
                        </p>
                        <Badge
                          variant={pct >= 90 ? 'coral' : pct >= 60 ? 'amber' : 'emerald'}
                          size="sm"
                        >
                          {pct.toFixed(0)}%
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT — Formulario de abono ═══ */}
        <div className="xl:col-span-5">
          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
              <CreditCard className="h-4 w-4 text-hc-cobalt-light" />
              Registrar Pago / Abono
            </h2>

            {!selectedCustomer ? (
              <div className="rounded-lg border border-gray-700/40 bg-hc-surface-dark px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  Selecciona un cliente de la lista
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info del cliente */}
                <div className="rounded-lg border border-gray-700/40 bg-hc-surface-dark px-4 py-3">
                  <p className="text-sm font-semibold text-gray-200">{selectedCustomer.companyName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Deuda actual</span>
                    <span className="font-mono font-bold text-hc-coral text-sm">
                      {formatCurrency(selectedCustomer.currentDebt)}
                    </span>
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Monto a abonar *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]{0,2}"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none font-mono"
                  />
                </div>

                {/* Método */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Método de pago *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMethod(m.value)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                          method === m.value
                            ? 'border-hc-cobalt/50 bg-hc-cobalt/10 text-hc-cobalt-light'
                            : 'border-gray-700/40 bg-hc-surface-dark text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Referencia de pago..."
                    className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                  />
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-hc-coral flex-shrink-0" />
                    <p className="text-xs text-hc-coral">{submitError}</p>
                  </div>
                )}

                {submitSuccess && (
                  <div className="rounded-lg border border-hc-emerald/30 bg-hc-emerald/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-hc-emerald" />
                      <p className="text-xs font-semibold text-hc-emerald">Pago registrado</p>
                    </div>
                    {newDebt !== null && (
                      <p className="mt-1 text-xs text-gray-400">
                        Nueva deuda: <span className="text-hc-coral font-mono">{formatCurrency(newDebt)}</span>
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={CheckCircle2}
                  loading={submitting}
                  disabled={!amount}
                  onClick={handlePago}
                >
                  Confirmar Pago
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
