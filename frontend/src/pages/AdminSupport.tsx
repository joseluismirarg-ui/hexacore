import React, { useState, useEffect } from 'react';
import { LifeBuoy, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { api } from '../lib/api';

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  createdAt: string;
  tenant: { name: string };
  user: { name: string; email: string };
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/tickets');
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
      } else if (Array.isArray(res)) {
        setTickets(res as any);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await api.put(`/api/tickets/${id}/status`, { status });
      if (res.success || res) {
        fetchTickets();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'amber';
      case 'IN_PROGRESS': return 'cobalt';
      case 'RESOLVED': return 'emerald';
      case 'CLOSED': return 'gray';
      default: return 'gray';
    }
  };

  if (isLoading) return <div>Cargando tickets...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Centro de Soporte</h1>
        <p className="text-gray-400 mt-2">Gestiona los tickets de todos los inquilinos (Tenants).</p>
      </div>

      <div className="grid gap-4">
        {tickets.map(ticket => (
          <div key={ticket.id} className="p-6 border border-gray-800 bg-hc-surface-dark rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{ticket.subject}</h3>
                  <Badge variant={getStatusColor(ticket.status) as any}>{ticket.status}</Badge>
                  <Badge variant="gray">{ticket.priority}</Badge>
                </div>
                <p className="text-sm text-gray-400 mb-4 whitespace-pre-wrap">{ticket.body}</p>
                <div className="text-xs text-gray-500 flex gap-4">
                  <span>🏢 Tenant: <strong className="text-gray-300">{ticket.tenant?.name || 'N/A'}</strong></span>
                  <span>👤 Usuario: <strong className="text-gray-300">{ticket.user?.name || 'N/A'} ({ticket.user?.email})</strong></span>
                  <span>📅 Creado: {new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                  <button 
                    onClick={() => updateStatus(ticket.id, 'RESOLVED')}
                    className="text-sm px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Marcar Resuelto
                  </button>
                )}
                {ticket.status === 'OPEN' && (
                  <button 
                    onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}
                    className="text-sm px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4" /> En Progreso
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="text-center py-12 text-gray-500">No hay tickets de soporte pendientes. ¡Todo en orden!</div>
        )}
      </div>
    </div>
  );
}
