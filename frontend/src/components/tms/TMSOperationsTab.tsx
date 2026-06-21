import React, { useState } from 'react';
import { api, formatCurrency, formatTimestamp } from '@/lib/api';
import { Check, X, Eye, FileText, AlertTriangle } from 'lucide-react';
import { useAsync } from '@/lib/hooks';

export function TMSOperationsTab() {
  const { data, loading, execute: reload } = useAsync(() => api.get('/api/trucks/trips/expenses?status=PENDING'), true);
  const [showManualModal, setShowManualModal] = useState(false);
  const expenses = (data as any)?.data || [];

  const handleStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/api/trucks/trips/expenses/${id}/status`, { status });
      reload();
    } catch (e) {
      console.error(e);
      alert('Error al actualizar estado');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    try {
      await api.post('/api/trucks/trips/expenses', {
        tripId: formData.get('tripId'), // Should be a valid trip ID
        amount: Number(formData.get('amount')),
        description: formData.get('description'),
        isManualException: true,
        manualReason: formData.get('manualReason'),
        expenseType: 'OTHER'
      });
      setShowManualModal(false);
      reload();
      alert('Excepción guardada correctamente');
    } catch (e) {
      console.error(e);
      alert('Error al guardar excepción manual');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div>
          <h3 className="text-xl font-bold text-white">Inbox de Viáticos y Gastos</h3>
          <p className="text-gray-400 text-sm">Gastos reportados por choferes pendientes de aprobación</p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 border border-red-600/30"
        >
          <AlertTriangle size={18} />
          Captura Manual por Excepción
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {expenses.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center text-gray-500 border border-gray-800 border-dashed rounded-xl">
            No hay gastos pendientes de aprobación.
          </div>
        )}

        {expenses.map((exp: any) => (
          <div key={exp.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block">
                  {exp.status}
                </span>
                <h4 className="text-2xl font-black text-white">{formatCurrency(Number(exp.amount))}</h4>
                <p className="text-gray-400 mt-1">{exp.description}</p>
              </div>
              {exp.receiptUrl && (
                <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="bg-gray-800 p-3 rounded-xl hover:bg-gray-700 transition-colors text-primary">
                  <FileText size={24} />
                </a>
              )}
            </div>

            <div className="text-xs text-gray-500 mb-6 bg-gray-950 p-3 rounded-lg">
              <p>Viaje ID: <span className="text-gray-300 font-mono">{exp.trip?.tripId || exp.tripId}</span></p>
              <p>Fecha: {formatTimestamp(exp.createdAt)}</p>
              {exp.isManualException && (
                <p className="mt-2 text-red-400 font-bold">CAPTURA MANUAL - NO VERIFICADA: {exp.manualReason}</p>
              )}
            </div>

            <div className="mt-auto flex gap-3">
              <button
                onClick={() => handleStatus(exp.id, 'APPROVED')}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Check size={18} /> Aprobar
              </button>
              <button
                onClick={() => handleStatus(exp.id, 'REJECTED')}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <X size={18} /> Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Manual */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
              <AlertTriangle /> Captura por Excepción
            </h3>
            <p className="text-gray-400 text-sm mb-6">Esta opción bypassa la PWA del chofer y pre-aprueba el gasto bajo el nombre del Administrador.</p>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">ID del Viaje (Base de Datos)</label>
                <input required name="tripId" type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Monto</label>
                <input required name="amount" type="number" step="0.01" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Descripción del Gasto</label>
                <input required name="description" type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400 text-red-400">Razón de la Excepción</label>
                <select required name="manualReason" className="w-full bg-gray-800 border border-red-900/50 rounded-lg p-3 text-white mt-1 outline-none">
                  <option value="">Selecciona la razón</option>
                  <option value="Falla de red del chofer">Falla de red del chofer</option>
                  <option value="Pérdida de dispositivo">Pérdida de dispositivo</option>
                  <option value="Emergencia médica o legal">Emergencia médica o legal</option>
                  <option value="Error humano de captura previa">Error humano de captura previa</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowManualModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-3 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-bold">Forzar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
