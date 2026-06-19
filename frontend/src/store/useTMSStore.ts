import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export interface TripStop {
  id: string;
  sequence: number;
  customerName: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED' | 'ISSUE';
  notes?: string;
}

interface TMSState {
  tripId: string | null;
  stops: TripStop[];
  pendingSync: { stopId: string, status: string, notes?: string }[];
  loadTrip: () => Promise<void>;
  markStopAs: (stopId: string, status: string, notes?: string) => void;
  syncOfflineData: () => Promise<void>;
}

export const useTMSStore = create<TMSState>()(
  persist(
    (set, get) => ({
      tripId: null,
      stops: [],
      pendingSync: [],
      loadTrip: async () => {
        try {
          const res = await api.get<any>('/api/driver/trips/active');
          if (res.data?.data) {
            set({ tripId: res.data.data.id, stops: res.data.data.stops });
          }
        } catch (e) {
          console.error("Error cargando viaje activo", e);
        }
      },
      markStopAs: (stopId, status, notes) => {
        // 1. Actualización Optimista Local (UI instantánea)
        set((state) => ({
          stops: state.stops.map(s => s.id === stopId ? { ...s, status: status as any, notes } : s),
          pendingSync: [...state.pendingSync, { stopId, status, notes }]
        }));
        // 2. Intentar Sincronizar en background
        get().syncOfflineData();
      },
      syncOfflineData: async () => {
        const { pendingSync } = get();
        if (pendingSync.length === 0 || !navigator.onLine) return;

        for (const item of pendingSync) {
          try {
            await api.put(`/api/driver/stops/${item.stopId}/status`, { status: item.status, notes: item.notes });
            // Si tiene éxito, remover de la cola de pendientes
            set((state) => ({
              pendingSync: state.pendingSync.filter(p => p.stopId !== item.stopId)
            }));
          } catch (e) {
             console.error("Falla silenciosa al sincronizar parada, se reintentará luego", e);
          }
        }
      }
    }),
    { name: 'tms-offline-storage' }
  )
);
