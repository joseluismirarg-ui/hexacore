import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Camera, Upload, X, Loader2, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  tripId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DriverExpenseReporter({ tripId, onClose, onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState('DEFAULT');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setSubmitting(true);
    setError(null);

    try {
      let receiptUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `tms-expenses/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('hexacore-storage')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('hexacore-storage')
          .getPublicUrl(filePath);

        receiptUrl = publicUrl;
      }

      const res = await api.post('/api/trucks/trips/expenses', {
        tripId,
        amount: Number(amount),
        description,
        expenseType,
        receiptUrl,
        isManualException: false
      });

      if (res.success) {
        setIsOpen(false);
        setAmount('');
        setDescription('');
        setFile(null);
        onSuccess();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error al reportar gasto');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-rose-600 text-white p-4 rounded-full shadow-lg hover:bg-rose-700 transition-colors z-50 flex items-center justify-center"
      >
        <Plus className="w-6 h-6 mr-2" />
        <span className="font-semibold">Gasto Extra</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-lg font-bold text-white">Reportar Gasto</h3>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-800 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Concepto Corto</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Ej. Talacha, Caseta extra, Multa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Foto o Ticket (Opcional pero recomendado)</label>
            <div 
              className="border-2 border-dashed border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Toca para adjuntar foto</span>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setFile(files[0] || null);
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover text-white rounded-xl px-4 py-3 font-semibold flex items-center justify-center mt-6 transition-all"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Reporte'}
          </button>
        </form>
      </div>
    </div>
  );
}
