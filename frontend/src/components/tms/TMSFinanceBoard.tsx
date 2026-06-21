import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Check, X, Loader2, DollarSign, Fuel, MapPin, Search } from 'lucide-react';

import { formatCurrency, formatTimestamp } from '@/lib/api';

export function TMSFinanceBoard() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/api/trucks/expenses/pending');
      if (res.data?.success) {
        setExpenses(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingExpenses();
  }, []);

  const handleApprove = async (id: string, isApprove: boolean) => {
    setProcessingId(id);
    try {
      const res = await api.patch(`/api/trucks/trips/expenses/${id}/status`, {
        status: isApprove ? 'APPROVED' : 'REJECTED'
      });
      if (res.success) {
        loadPendingExpenses();
      }
    } catch (e) {
      console.error("Error al procesar gasto", e);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl">
        <Check className="w-12 h-12 mb-4 text-green-500 opacity-50" />
        <h3 className="text-xl font-medium text-white mb-1">Todo al día</h3>
        <p>No hay gastos pendientes por auditar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-6 border border-gray-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Cuentas por Pagar (Gastos TMS)</h2>
          <p className="text-sm text-gray-400">Audita y aprueba los gastos reportados por los operadores.</p>
        </div>
        <div className="bg-primary/20 text-primary px-4 py-2 rounded-xl font-bold border border-primary/30">
          {expenses.length} Pendiente(s)
        </div>
      </div>

      <div className="grid gap-4">
        {expenses.map(expense => (
          <div key={expense.id} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            <div className="flex-1 flex items-start gap-4">
              <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                {expense.expenseType === 'FUEL' ? <Fuel className="w-6 h-6 text-orange-400" /> : <DollarSign className="w-6 h-6 text-green-400" />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-lg font-bold text-white">{expense.description}</h4>
                  <span className="bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">{expense.expenseType}</span>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  <span className="font-medium text-gray-300">{expense.trip?.driver?.name}</span> • Placas: {expense.trip?.truck?.plate}
                </div>
                
                {expense.expenseType === 'FUEL' && expense.fuelLiters && (
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500 bg-gray-800/50 p-2 rounded-lg inline-flex">
                    <span>⛽ {expense.fuelLiters} Litros</span>
                    <span>📍 Odómetro: {expense.odometerReading} Km</span>
                  </div>
                )}
                
                {expense.receiptUrl && (
                  <div className="mt-3">
                    <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm font-medium">
                      📎 Ver Ticket / Factura Adjunta
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-gray-800 pt-4 md:pt-0 mt-4 md:mt-0">
              <div className="text-2xl font-black text-white bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
                {formatCurrency(Number(expense.amount))}
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleApprove(expense.id, false)}
                  disabled={processingId === expense.id}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gray-800 hover:bg-rose-900/30 text-rose-500 border border-gray-700 hover:border-rose-800 font-semibold transition-colors flex justify-center"
                >
                  {processingId === expense.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleApprove(expense.id, true)}
                  disabled={processingId === expense.id}
                  className="flex-1 md:flex-none px-6 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                >
                  {processingId === expense.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Autorizar</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-xs text-gray-500">{formatTimestamp(expense.createdAt)}</span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
