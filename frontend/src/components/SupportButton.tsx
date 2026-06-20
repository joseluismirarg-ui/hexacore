import React, { useState } from 'react';
import { LifeBuoy, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '../lib/api';

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) return;

    setIsLoading(true);
    try {
      const res = await api.post('/api/tickets', { subject, body });

      if (res.success || (res as any).id) {
        alert('Ticket enviado con éxito. Te contactaremos pronto.');
        setIsOpen(false);
        setSubject('');
        setBody('');
      } else {
        alert(res.message || 'Error al enviar el ticket');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-hc-cobalt text-white rounded-full shadow-lg shadow-hc-cobalt/30 hover:bg-hc-cobalt-dark transition-all hover:scale-110 active:scale-95"
      >
        <LifeBuoy className="h-6 w-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-hc-surface w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-hc-surface-dark">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-hc-cobalt" />
                Soporte Técnico
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Asunto</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-hc-bg border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-hc-cobalt focus:outline-none"
                  placeholder="Ej: Problema con inventario"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Descripción</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-hc-bg border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-hc-cobalt focus:outline-none resize-none"
                  placeholder="Detalla tu problema..."
                ></textarea>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                  Enviar Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
