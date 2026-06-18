import React, { useState, useEffect } from 'react';
import { useAsync } from '@/lib/hooks';
import { api, formatCurrency, formatTimestamp } from '@/lib/api';
import { 
  Truck, Users, Map as MapIcon, Package, AlertTriangle, 
  CheckCircle, Clock, MapPin, Fuel, Wrench, Navigation, Plus
} from 'lucide-react';

export default function TruckDashboard() {
  const [activeTab, setActiveTab] = useState<'occ' | 'fleet' | 'trips'>('occ');

  const { data: trucksData, execute: reloadTrucks } = useAsync(() => api.get('/api/trucks'), true);
  const { data: driversData, execute: reloadDrivers } = useAsync(() => api.get('/api/trucks/drivers'), true);
  const { data: tripsData, execute: reloadTrips } = useAsync(() => api.get('/api/trucks/trips'), true);

  const trucks = (trucksData as any)?.data || [];
  const drivers = (driversData as any)?.data || [];
  const trips = (tripsData as any)?.data || [];

  const inTransitCount = trucks.filter((t: any) => t.status === 'IN_TRANSIT').length;
  const maintCount = trucks.filter((t: any) => t.status === 'MAINTENANCE').length;
  const pendingUnloads = trips.filter((t: any) => !t.arrivalDateTime).length;

  const handleUpdateTruckStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/trucks/${id}/status`, { status });
      reloadTrucks();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex h-full flex-col bg-hc-surface p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Truck className="h-6 w-6 text-hc-cobalt-light" />
            Control Logístico TMS
          </h1>
          <p className="text-sm text-gray-400">Operational Control Center (OCC)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-700/50 pb-2">
        <button
          onClick={() => setActiveTab('occ')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all ${
            activeTab === 'occ' ? 'border-b-2 border-hc-cobalt-light text-hc-cobalt-light' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <MapIcon className="h-4 w-4" /> Centro de Control (OCC)
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all ${
            activeTab === 'fleet' ? 'border-b-2 border-hc-cobalt-light text-hc-cobalt-light' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Truck className="h-4 w-4" /> Flota y Choferes
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all ${
            activeTab === 'trips' ? 'border-b-2 border-hc-cobalt-light text-hc-cobalt-light' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Navigation className="h-4 w-4" /> Viajes Activos
        </button>
      </div>

      {/* Section A: OCC */}
      {activeTab === 'occ' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-hc-cobalt/20 p-2 text-hc-cobalt-light">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Flota Activa</p>
                  <p className="text-xl font-bold text-gray-100">{trucks.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">En Tránsito</p>
                  <p className="text-xl font-bold text-gray-100">{inTransitCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Viajes en Curso</p>
                  <p className="text-xl font-bold text-gray-100">{pendingUnloads}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-hc-surface-dark p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/20 p-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mantenimiento</p>
                  <p className="text-xl font-bold text-gray-100">{maintCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-4 h-96 flex items-center justify-center">
             <div className="text-center text-gray-500">
                <MapIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Mapa en vivo (Integración GPS pendiente)</p>
             </div>
          </div>
        </div>
      )}

      {/* Section B: Fleet Management */}
      {activeTab === 'fleet' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark overflow-hidden">
               <div className="border-b border-gray-700/50 bg-gray-800/40 px-4 py-3 font-medium text-gray-200">
                 Camiones Registrados
               </div>
               <div className="p-4">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-700/50">
                        <th className="pb-2">Placa / Modelo</th>
                        <th className="pb-2">Estatus</th>
                        <th className="pb-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trucks.map((t: any) => (
                        <tr key={t.id} className="border-b border-gray-700/20 last:border-0">
                          <td className="py-3">
                            <span className="font-semibold text-gray-200">{t.plate}</span><br/>
                            <span className="text-xs text-gray-500">{t.make} {t.model} ({t.year})</span>
                          </td>
                          <td className="py-3">
                            <select 
                               value={t.status} 
                               onChange={(e) => handleUpdateTruckStatus(t.id, e.target.value)}
                               className="bg-gray-800 border border-gray-700 rounded text-xs px-2 py-1 outline-none text-gray-300"
                            >
                               <option value="AVAILABLE">Disponible</option>
                               <option value="IN_TRANSIT">En Tránsito</option>
                               <option value="MAINTENANCE">Mantenimiento</option>
                               <option value="AWAITING_LOAD">Esperando Carga</option>
                            </select>
                          </td>
                          <td className="py-3">
                             <button className="text-hc-cobalt-light text-xs hover:underline">Historial</button>
                          </td>
                        </tr>
                      ))}
                      {trucks.length === 0 && (
                        <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-xs">No hay camiones</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>

            <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark overflow-hidden">
               <div className="border-b border-gray-700/50 bg-gray-800/40 px-4 py-3 font-medium text-gray-200">
                 Directorio de Choferes
               </div>
               <div className="p-4">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-700/50">
                        <th className="pb-2">Chofer</th>
                        <th className="pb-2">Licencia</th>
                        <th className="pb-2">Disponibilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.map((d: any) => (
                        <tr key={d.id} className="border-b border-gray-700/20 last:border-0">
                          <td className="py-3">
                            <span className="font-semibold text-gray-200">{d.name}</span><br/>
                            <span className="text-xs text-gray-500">{d.phone}</span>
                          </td>
                          <td className="py-3 font-mono text-xs">{d.licenseNumber}</td>
                          <td className="py-3">
                            {d.isAvailable ? (
                              <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded">Libre</span>
                            ) : (
                              <span className="text-amber-400 text-xs bg-amber-500/10 px-2 py-1 rounded">Asignado</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {drivers.length === 0 && (
                        <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-xs">No hay choferes registrados</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Section C: Trips */}
      {activeTab === 'trips' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {trips.length === 0 && (
             <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-8 text-center text-gray-500">
                No hay viajes registrados.
             </div>
          )}
          {trips.map((trip: any) => {
             const expenses = trip.expenses || [];
             const totalExp = expenses.reduce((acc: number, ex: any) => acc + Number(ex.amount), 0);
             const isOngoing = !trip.arrivalDateTime;

             return (
               <div key={trip.id} className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-5">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-lg font-bold text-gray-200">{trip.tripId}</h3>
                     <p className="text-sm text-gray-400">Cliente: {trip.client?.name}</p>
                   </div>
                   {isOngoing ? (
                     <span className="bg-hc-cobalt/20 text-hc-cobalt-light px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                       EN RUTA
                     </span>
                   ) : (
                     <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                       COMPLETADO
                     </span>
                   )}
                 </div>

                 <div className="grid grid-cols-3 gap-4 mb-4">
                   <div className="bg-gray-800/40 rounded p-3">
                     <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Origen</p>
                     <p className="text-sm text-gray-300">{trip.originAddress}</p>
                   </div>
                   <div className="bg-gray-800/40 rounded p-3">
                     <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Destino</p>
                     <p className="text-sm text-gray-300">{trip.destinationAddress}</p>
                   </div>
                   <div className="bg-gray-800/40 rounded p-3">
                     <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Package className="h-3 w-3"/> Carga</p>
                     <p className="text-sm text-gray-300">{trip.cargoDescription}</p>
                   </div>
                 </div>

                 <div className="flex items-center justify-between border-t border-gray-700/50 pt-4 mt-2">
                   <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                       <Truck className="h-4 w-4 text-gray-400"/>
                       <span className="text-sm text-gray-300">{trip.truck?.plate}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Users className="h-4 w-4 text-gray-400"/>
                       <span className="text-sm text-gray-300">{trip.driver?.name}</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-gray-500">Gastos Registrados</p>
                     <p className="text-lg font-mono text-gray-200">{formatCurrency(totalExp)}</p>
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      )}

    </div>
  );
}
