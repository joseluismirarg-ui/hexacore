// =============================================================================
// HEXA CORE SYSTEMS — frontend/src/pages/CxcDashboard.tsx
// Dashboard de Cuentas por Cobrar
// =============================================================================

import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatTimestamp } from '@/lib/api';
import { DollarSign, AlertCircle, CheckCircle, Search, ShieldAlert, CreditCard } from 'lucide-react';

export default function CxcDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form states
  const [amount, setAmount] = useState<number | string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [method, setMethod] = useState<string>('EFECTIVO');
  const [notes, setNotes] = useState<string>('');

  const fetchAging = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/api/cxc/aging');
      if (res && res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAging();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        customerId: selectedCustomer.id,
        amount: Number(amount),
        method,
        notes,
        ...(transactionId ? { transactionId } : {})
      };
      
      await api.post('/api/cxc/payments', payload);
      setIsModalVisible(false);
      setAmount('');
      setTransactionId('');
      setNotes('');
      fetchAging();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Error al registrar pago');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <DollarSign size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Cuentas por Cobrar (CxC)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente o RFC..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Límite Crédito</th>
                <th className="px-6 py-4">Deuda Actual</th>
                <th className="px-6 py-4">Monto Vencido</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Cargando información...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No hay cuentas por cobrar pendientes.
                  </td>
                </tr>
              ) : (
                data.map((record) => {
                  const debt = Number(record.currentDebt);
                  const overdue = Number(record.overdueAmount);
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{record.companyName}</div>
                        <div className="text-xs text-gray-500">{record.rfc}</div>
                      </td>
                      <td className="px-6 py-4 font-mono">{formatCurrency(record.creditLimit)}</td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">
                        {formatCurrency(debt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-mono font-bold ${overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(overdue)}
                        </div>
                        {overdue > 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            ({record.maxDaysOverdue} días de atraso)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <ShieldAlert size={14} /> Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle size={14} /> Al Corriente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedCustomer(record);
                            setIsModalVisible(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Abonar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pago */}
      {isModalVisible && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard size={18} className="text-blue-600" />
                Registrar Pago - {selectedCustomer.companyName}
              </h3>
              <button 
                onClick={() => setIsModalVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Deuda Total</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedCustomer.currentDebt)}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Vencido</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(selectedCustomer.overdueAmount)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Abono</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aplicar a Nota (Opcional)</label>
                <select
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                >
                  <option value="">-- Pago a Deuda Global --</option>
                  {selectedCustomer.transactions?.map((tx: any) => (
                    <option key={tx.id} value={tx.id}>
                      {tx.tipo} - {formatTimestamp(tx.createdAt)} - {formatCurrency(tx.total)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Si se omite, el pago reducirá la deuda global sin saldar una nota específica.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
                <select
                  required
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                >
                  <option value="EFECTIVO">Efectivo (01)</option>
                  <option value="TRANSFERENCIA">Transferencia Electrónica (03)</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito (04)</option>
                  <option value="TARJETA_DEBITO">Tarjeta de Débito (28)</option>
                  <option value="POR_DEFINIR">Por Definir (99)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                  placeholder="Ej. Transferencia Banamex #12345"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalVisible(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Registrar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
