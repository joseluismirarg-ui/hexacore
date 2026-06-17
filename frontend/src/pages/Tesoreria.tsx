import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { api, formatCurrency, formatTimestamp } from '../lib/api';

export default function Tesoreria() {
  const { data: accountsData, loading, execute: reload } = useAsync(() => api.get('/api/treasury/accounts'), true);
  const accounts: any[] = (accountsData as any)?.data || [];

  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [movForm, setMovForm] = useState({ type: 'DEPOSITO', amount: '', concept: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !movForm.amount.trim() || !movForm.concept.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/api/treasury/movements', {
        bankAccountId: selectedAccount,
        type: movForm.type,
        amount: movForm.amount.trim(),
        concept: movForm.concept.trim(),
      });
      setMovForm({ type: 'DEPOSITO', amount: '', concept: '' });
      setShowForm(false);
      setSelectedAccount(null);
      reload();
    } catch (err: any) {
      alert(err?.message || 'Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tesorería</h1>
          <p className="text-muted-foreground">Gestión de cuentas bancarias y movimientos financieros.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando cuentas bancarias...</p>
      ) : (
        <div className="space-y-6">
          {/* Tarjetas de cuentas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(accounts || []).map((acc: any) => (
              <div key={acc.id} className="rounded-xl border bg-card p-6 hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{acc.bankName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Cuenta: {acc.accountNumber}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Saldo Actual</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(acc.currentBalance || '0')}</p>
                </div>
                <button
                  onClick={() => { setSelectedAccount(acc.id); setShowForm(true); }}
                  className="w-full bg-primary/10 text-primary py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  Registrar Movimiento
                </button>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No hay cuentas bancarias registradas. Crea una desde el Panel de Super Admin.
              </div>
            )}
          </div>

          {/* Formulario de Movimiento */}
          {showForm && (
            <div className="rounded-xl border bg-card p-6 max-w-lg">
              <h3 className="text-lg font-semibold mb-4">Nuevo Movimiento Bancario</h3>
              <form onSubmit={handleCreateMovement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tipo</label>
                  <select
                    value={movForm.type}
                    onChange={(e) => setMovForm({ ...movForm, type: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="DEPOSITO">Depósito</option>
                    <option value="RETIRO">Retiro</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="COMISION">Comisión Bancaria</option>
                    <option value="INTERES">Interés</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Monto</label>
                  <input
                    type="text"
                    value={movForm.amount}
                    onChange={(e) => setMovForm({ ...movForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Concepto</label>
                  <input
                    type="text"
                    value={movForm.concept}
                    onChange={(e) => setMovForm({ ...movForm, concept: e.target.value })}
                    placeholder="Descripción del movimiento"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Procesando...' : 'Registrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setSelectedAccount(null); }}
                    className="px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
