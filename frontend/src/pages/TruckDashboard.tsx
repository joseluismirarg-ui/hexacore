import React, { useState, useEffect } from 'react';
import { useAsync } from '@/lib/hooks';
import { api, formatCurrency, formatTimestamp } from '@/lib/api';
import { 
  Truck, Users, Map as MapIcon, Package, AlertTriangle, 
  CheckCircle, Clock, MapPin, Fuel, Wrench, Navigation, Plus,
  FileText, X, ChevronRight, BarChart
} from 'lucide-react';

import { TMSOperationsTab } from './tms/TMSOperationsTab';
import { TMSAnalyticsTab } from './tms/TMSAnalyticsTab';

export default function TruckDashboard() {
  const [activeTab, setActiveTab] = useState<'occ' | 'fleet' | 'trips' | 'reports' | 'finance'>('occ');
  const [financeSubTab, setFinanceSubTab] = useState<'operations' | 'analytics'>('operations');

  // Modal States
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  
  // Trip Specific Modal States
  const [expenseTripId, setExpenseTripId] = useState<string | null>(null);
  const [completeTripId, setCompleteTripId] = useState<string | null>(null);

  // Array dinámico para las paradas del viaje
  const [dispatchStops, setDispatchStops] = useState([{ customerName: '', address: '', phone: '' }]);

  const { data: trucksData, execute: reloadTrucks } = useAsync(() => api.get('/api/trucks'), true);
  const { data: driversData, execute: reloadDrivers } = useAsync(() => api.get('/api/trucks/drivers'), true);
  const { data: clientsData, execute: reloadClients } = useAsync(() => api.get('/api/trucks/clients'), true);
  const { data: tripsData, execute: reloadTrips } = useAsync(() => api.get('/api/trucks/trips'), true);

  const trucks = (trucksData as any)?.data || [];
  const drivers = (driversData as any)?.data || [];
  const clients = (clientsData as any)?.data || [];
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

  const handleCreateTruck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/api/trucks', Object.fromEntries(formData));
      setShowTruckModal(false);
      reloadTrucks();
    } catch (err) { console.error(err); }
  };

  const handleCreateDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/api/trucks/drivers', Object.fromEntries(formData));
      setShowDriverModal(false);
      reloadDrivers();
    } catch (err) { console.error(err); }
  };

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/api/trucks/clients', Object.fromEntries(formData));
      setShowClientModal(false);
      reloadClients();
    } catch (err) { console.error(err); }
  };

  const handleDispatchTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);
    
    // Adjuntamos el array de paradas
    payload.stops = dispatchStops as any;

    try {
      await api.post('/api/trucks/trips/dispatch', payload);
      setShowDispatchModal(false);
      setDispatchStops([{ customerName: '', address: '', phone: '' }]); // Reset
      reloadTrips();
      reloadTrucks();
      reloadDrivers();
    } catch (err) { console.error(err); }
  };

  const handleCompleteTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!completeTripId) return;
    const formData = new FormData(e.currentTarget);
    try {
      await api.post(`/api/trucks/trips/${completeTripId}/complete`, Object.fromEntries(formData));
      setCompleteTripId(null);
      reloadTrips();
      reloadTrucks();
      reloadDrivers();
    } catch (err) { console.error(err); }
  };

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!expenseTripId) return;
    const formData = new FormData(e.currentTarget);
    try {
      await api.post(`/api/trucks/trips/${expenseTripId}/expenses`, {
         expenseType: formData.get('expenseType'),
         amount: parseFloat(formData.get('amount') as string),
         currency: formData.get('currency'),
         notes: formData.get('notes')
      });
      setExpenseTripId(null);
      reloadTrips();
    } catch (err) { console.error(err); }
  };

  // UI Helper for Modals
  const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );

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
          <Truck className="h-4 w-4" /> Flota y Catálogos
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all ${
            activeTab === 'trips' ? 'border-b-2 border-hc-cobalt-light text-hc-cobalt-light' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Navigation className="h-4 w-4" /> Viajes y Despachos
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all ${
            activeTab === 'reports' ? 'border-b-2 border-hc-cobalt-light text-hc-cobalt-light' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <BarChart className="h-4 w-4" /> Reportes TMS
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all ${
            activeTab === 'finance' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <BarChart className="h-4 w-4" /> Control Financiero
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
          
          {/* Action Bar */}
          <div className="flex gap-4">
             <button onClick={() => setShowTruckModal(true)} className="flex items-center gap-2 rounded bg-hc-cobalt/20 text-hc-cobalt-light px-4 py-2 text-sm font-medium hover:bg-hc-cobalt/30 transition-colors">
               <Plus className="h-4 w-4" /> Nuevo Camión
             </button>
             <button onClick={() => setShowDriverModal(true)} className="flex items-center gap-2 rounded bg-hc-cobalt/20 text-hc-cobalt-light px-4 py-2 text-sm font-medium hover:bg-hc-cobalt/30 transition-colors">
               <Users className="h-4 w-4" /> Nuevo Chofer
             </button>
             <button onClick={() => setShowClientModal(true)} className="flex items-center gap-2 rounded bg-hc-cobalt/20 text-hc-cobalt-light px-4 py-2 text-sm font-medium hover:bg-hc-cobalt/30 transition-colors">
               <MapPin className="h-4 w-4" /> Nuevo Cliente Logístico
             </button>
          </div>

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
                        </tr>
                      ))}
                      {trucks.length === 0 && (
                        <tr><td colSpan={2} className="py-4 text-center text-gray-500 text-xs">No hay camiones</td></tr>
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
            
            {/* Clientes Logísticos Panel */}
            <div className="col-span-2 rounded-xl border border-gray-700/50 bg-hc-surface-dark overflow-hidden">
               <div className="border-b border-gray-700/50 bg-gray-800/40 px-4 py-3 font-medium text-gray-200">
                 Clientes Logísticos (Destinos Frecuentes)
               </div>
               <div className="p-4">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-700/50">
                        <th className="pb-2">Nombre Cliente</th>
                        <th className="pb-2">Contacto</th>
                        <th className="pb-2">Dirección de Entrega</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c: any) => (
                        <tr key={c.id} className="border-b border-gray-700/20 last:border-0">
                          <td className="py-3 font-semibold text-gray-200">{c.name}</td>
                          <td className="py-3">
                            <span className="text-gray-300">{c.billingContact || '-'}</span><br/>
                            <span className="text-xs text-gray-500">{c.phone}</span>
                          </td>
                          <td className="py-3 text-xs">{c.deliveryAddress}</td>
                        </tr>
                      ))}
                      {clients.length === 0 && (
                        <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-xs">No hay clientes logísticos</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* TABS CONTENIDO */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="flex gap-4 border-b border-gray-800 pb-2">
            <button
              onClick={() => setFinanceSubTab('operations')}
              className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                financeSubTab === 'operations' ? 'bg-gray-800 text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Operación Activa
            </button>
            <button
              onClick={() => setFinanceSubTab('analytics')}
              className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                financeSubTab === 'analytics' ? 'bg-gray-800 text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Inteligencia Financiera
            </button>
          </div>
          
          <div className="bg-gray-950 p-4 rounded-b-lg border border-t-0 border-gray-800 min-h-[500px]">
            {financeSubTab === 'operations' ? <TMSOperationsTab /> : <TMSAnalyticsTab />}
          </div>
        </div>
      )}

      {/* Modales de Creación */}
      {/* Section C: Trips */}
      {activeTab === 'trips' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-200">Viajes en Curso</h2>
            <button onClick={() => setShowDispatchModal(true)} className="flex items-center gap-2 rounded bg-hc-cobalt text-white px-5 py-2 text-sm font-semibold hover:bg-hc-cobalt-light transition-colors shadow-lg">
               <Navigation className="h-4 w-4" /> Despachar Viaje
            </button>
          </div>

          {trips.filter((t: any) => !t.arrivalDateTime).length === 0 && (
             <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-8 text-center text-gray-500">
                No hay viajes en curso registrados.
             </div>
          )}
          {trips.filter((t: any) => !t.arrivalDateTime).map((trip: any) => {
             const expenses = trip.expenses || [];
             const totalExp = expenses.reduce((acc: number, ex: any) => acc + Number(ex.amount), 0);

             return (
               <div key={trip.id} className="rounded-xl border border-gray-700/50 bg-hc-surface-dark p-5">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-lg font-bold text-gray-200">{trip.tripId}</h3>
                     <p className="text-sm text-gray-400">Cliente: {trip.client?.name}</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => setExpenseTripId(trip.id)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded text-xs font-medium border border-gray-600 transition-colors flex items-center gap-1">
                       <Fuel className="h-3 w-3" /> Registrar Gasto
                     </button>
                     <button onClick={() => setCompleteTripId(trip.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                       <CheckCircle className="h-3 w-3" /> Marcar Arribo
                     </button>
                   </div>
                 </div>

                 <div className="grid grid-cols-4 gap-4 mb-4">
                   <div className="bg-gray-800/40 rounded p-3">
                     <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="h-3 w-3"/> Salida</p>
                     <p className="text-sm text-gray-300 font-mono">{formatTimestamp(trip.departureDateTime)}</p>
                   </div>
                   <div className="bg-gray-800/40 rounded p-3">
                     <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Origen</p>
                     <p className="text-sm text-gray-300 truncate" title={trip.originAddress}>{trip.originAddress}</p>
                   </div>
                   <div className="bg-gray-800/40 rounded p-3">
                     <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Destino</p>
                     <p className="text-sm text-gray-300 truncate" title={trip.destinationAddress}>{trip.destinationAddress}</p>
                   </div>
                   <div className="bg-gray-800/40 rounded p-3">
                     <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Package className="h-3 w-3"/> Carga</p>
                     <p className="text-sm text-gray-300 truncate" title={trip.cargoDescription}>{trip.cargoDescription}</p>
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
                   <div className="flex gap-8 text-right">
                     <div>
                       <p className="text-xs text-gray-500">Facturación Estimada</p>
                       <p className="text-lg font-mono text-gray-200">{formatCurrency(Number(trip.estimatedRevenue || 0))}</p>
                     </div>
                     <div>
                       <p className="text-xs text-gray-500">Gastos Acumulados</p>
                       <p className="text-lg font-mono text-red-300">{formatCurrency(totalExp)}</p>
                     </div>
                     <div>
                       <p className="text-xs text-gray-500">Rentabilidad Actual</p>
                       <p className={`text-lg font-mono font-bold ${Number(trip.estimatedRevenue || 0) - totalExp > 0 ? 'text-green-400' : 'text-red-400'}`}>
                         {formatCurrency(Number(trip.estimatedRevenue || 0) - totalExp)}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      )}

      {/* Section D: Reports TMS */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="text-lg font-medium text-gray-200 mb-4">Historial de Viajes Completados</h2>
          
          <div className="rounded-xl border border-gray-700/50 bg-hc-surface-dark overflow-hidden">
              <table className="w-full text-left text-sm text-gray-300">
               <thead>
                 <tr className="text-gray-500 border-b border-gray-700/50 bg-gray-800/40">
                   <th className="p-4">Viaje / Cliente</th>
                   <th className="p-4">Ruta</th>
                   <th className="p-4">Fechas</th>
                   <th className="p-4 text-right">Facturación</th>
                   <th className="p-4 text-right">Costos Op.</th>
                   <th className="p-4 text-right">Margen Bruto</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-700/20">
                 {trips.filter((t: any) => t.arrivalDateTime).map((trip: any) => {
                    const totalExp = (trip.expenses || []).reduce((acc: number, ex: any) => acc + Number(ex.amount), 0);
                    const revenue = Number(trip.estimatedRevenue || 0);
                    const margin = revenue - totalExp;
                    const marginColor = margin > 0 ? 'text-green-400' : margin < 0 ? 'text-red-400' : 'text-gray-400';
                    return (
                      <tr key={trip.id} className="hover:bg-gray-800/20">
                        <td className="p-4">
                          <span className="font-semibold text-gray-200">{trip.tripId}</span><br/>
                          <span className="text-xs text-gray-500">{trip.client?.name}</span>
                        </td>
                        <td className="p-4 text-xs">
                           <span className="text-gray-400">Origen:</span> {trip.originAddress}<br/>
                           <span className="text-gray-400">Destino:</span> {trip.destinationAddress}
                        </td>
                        <td className="p-4 text-xs font-mono text-gray-400">
                           {formatTimestamp(trip.departureDateTime)}<br/>
                           {formatTimestamp(trip.arrivalDateTime)}
                        </td>
                        <td className="p-4 text-right font-mono text-gray-200">
                           {formatCurrency(revenue)}
                        </td>
                        <td className="p-4 text-right font-mono text-red-300">
                           {formatCurrency(totalExp)}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${marginColor}`}>
                           {formatCurrency(margin)}
                        </td>
                      </tr>
                    );
                 })}
                 {trips.filter((t: any) => t.arrivalDateTime).length === 0 && (
                   <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay historial de viajes completados.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}


      {/* MODALS */}

      {showTruckModal && (
        <Modal title="Registrar Nuevo Camión" onClose={() => setShowTruckModal(false)}>
          <form onSubmit={handleCreateTruck} className="space-y-4">
             <div><label className="text-xs text-gray-400">Placa</label><input required name="plate" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Marca</label><input required name="make" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Modelo</label><input required name="model" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Año</label><input type="number" name="year" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <button type="submit" className="w-full bg-hc-cobalt text-white py-2 rounded font-medium mt-4">Guardar Camión</button>
          </form>
        </Modal>
      )}

      {showDriverModal && (
        <Modal title="Registrar Nuevo Chofer" onClose={() => setShowDriverModal(false)}>
          <form onSubmit={handleCreateDriver} className="space-y-4">
             <div><label className="text-xs text-gray-400">Nombre Completo</label><input required name="name" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Número de Licencia</label><input required name="licenseNumber" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Teléfono</label><input required name="phone" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <button type="submit" className="w-full bg-hc-cobalt text-white py-2 rounded font-medium mt-4">Guardar Chofer</button>
          </form>
        </Modal>
      )}

      {showClientModal && (
        <Modal title="Nuevo Cliente Logístico" onClose={() => setShowClientModal(false)}>
          <form onSubmit={handleCreateClient} className="space-y-4">
             <div><label className="text-xs text-gray-400">Nombre del Cliente / Destino</label><input required name="name" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Dirección Exacta de Entrega</label><input required name="deliveryAddress" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div className="grid grid-cols-2 gap-2">
               <div><label className="text-xs text-gray-400">Contacto</label><input name="billingContact" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
               <div><label className="text-xs text-gray-400">Teléfono</label><input name="phone" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             </div>
             <button type="submit" className="w-full bg-hc-cobalt text-white py-2 rounded font-medium mt-4">Guardar Cliente</button>
          </form>
        </Modal>
      )}

      {showDispatchModal && (
        <Modal title="Despachar Nuevo Viaje (Armador de Rutas)" onClose={() => setShowDispatchModal(false)}>
          <form onSubmit={handleDispatchTrip} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
             <div className="grid grid-cols-2 gap-3">
               <div><label className="text-xs text-gray-400">Folio del Viaje</label><input required name="tripId" placeholder="EJ: VIAJE-101" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
               <div><label className="text-xs text-gray-400">Fecha/Hora Salida</label><input type="datetime-local" name="departureDateTime" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <div><label className="text-xs text-gray-400">Cliente Logístico (Principal)</label>
                  <select required name="clientId" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="">Seleccione Cliente...</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div><label className="text-xs text-gray-400 text-hc-cobalt-light font-bold">Monto de Facturación / Flete ($)</label><input required type="number" step="0.01" name="estimatedRevenue" placeholder="0.00" className="w-full bg-gray-800 border border-hc-cobalt/50 rounded p-2 text-sm text-white focus:border-hc-cobalt" /></div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div><label className="text-xs text-gray-400">Camión (Disponible)</label>
                  <select required name="truckId" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="">Seleccione Camión...</option>
                    {trucks.filter((t: any) => t.status !== 'IN_TRANSIT' && t.status !== 'MAINTENANCE').map((t: any) => <option key={t.id} value={t.id}>{t.plate}</option>)}
                  </select>
               </div>
               <div><label className="text-xs text-gray-400">Chofer (Libre)</label>
                  <select required name="driverId" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="">Seleccione Chofer...</option>
                    {drivers.filter((d: any) => d.isAvailable).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
               </div>
             </div>

             <div><label className="text-xs text-gray-400">Dirección Origen</label><input required name="originAddress" placeholder="De dónde sale el camión..." className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Dirección Destino (Última parada o Regreso)</label><input required name="destinationAddress" placeholder="A dónde llega al final..." className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Descripción de Carga</label><textarea required name="cargoDescription" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white"></textarea></div>

             {/* Dynamic Stops Array */}
             <div className="mt-6 border-t border-gray-700 pt-4">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-sm font-semibold text-gray-200">Paradas de Entrega (Ruta)</h3>
                 <button 
                   type="button" 
                   onClick={() => setDispatchStops([...dispatchStops, { customerName: '', address: '', phone: '' }])}
                   className="text-xs bg-hc-surface border border-gray-600 px-2 py-1 rounded text-gray-300 hover:text-white"
                 >+ Añadir Parada</button>
               </div>
               
               {dispatchStops.map((stop, index) => (
                 <div key={index} className="bg-gray-800/60 p-3 rounded mb-3 border border-gray-700 relative">
                   <div className="absolute top-2 right-2 flex gap-2">
                     <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                     {dispatchStops.length > 1 && (
                       <button type="button" onClick={() => setDispatchStops(dispatchStops.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-300">
                         <X size={14} />
                       </button>
                     )}
                   </div>
                   <div className="space-y-2 pr-6">
                     <input required placeholder="Nombre del Cliente (Ej. Abarrotes Pepe)" value={stop.customerName} onChange={(e) => {
                       const newStops = [...dispatchStops]; newStops[index]!.customerName = e.target.value; setDispatchStops(newStops);
                     }} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white" />
                     <input required placeholder="Dirección Exacta de la Entrega" value={stop.address} onChange={(e) => {
                       const newStops = [...dispatchStops]; newStops[index]!.address = e.target.value; setDispatchStops(newStops);
                     }} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white" />
                     <input placeholder="Teléfono de Contacto (Opcional)" value={stop.phone} onChange={(e) => {
                       const newStops = [...dispatchStops]; newStops[index]!.phone = e.target.value; setDispatchStops(newStops);
                     }} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white" />
                   </div>
                 </div>
               ))}
             </div>

             <button type="submit" className="w-full bg-hc-cobalt text-white py-3 rounded font-bold mt-6 shadow-lg hover:bg-hc-cobalt-light transition-all">Iniciar Despacho y Asignar Ruta</button>
          </form>
        </Modal>
      )}

      {expenseTripId && (
        <Modal title="Registrar Gasto / Imprevisto Operativo" onClose={() => setExpenseTripId(null)}>
          <form onSubmit={handleAddExpense} className="space-y-4">
             <div><label className="text-xs text-gray-400">Tipo de Gasto</label>
                <select required name="expenseType" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white">
                  <option value="FUEL">Combustible / Gasolina</option>
                  <option value="TOLLS">Peajes / Casetas</option>
                  <option value="PER_DIEM">Viáticos / Comidas</option>
                  <option value="MAINTENANCE">Mantenimiento Preventivo / Refacciones</option>
                  <option value="OTHER">Imprevistos Operativos (Multas, Desvíos, Ponchaduras)</option>
                </select>
             </div>
             <div><label className="text-xs text-gray-400">Monto del Gasto</label><input required type="number" step="0.01" name="amount" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Moneda</label><input required name="currency" defaultValue="MXN" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white" /></div>
             <div><label className="text-xs text-gray-400">Concepto / Notas (Opcional)</label><textarea name="notes" placeholder="Describa el imprevisto o detalle..." rows={2} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white"></textarea></div>

             <button type="submit" className="w-full bg-hc-cobalt text-white py-2 rounded font-medium mt-4">Registrar y Descontar de Rentabilidad</button>
          </form>
        </Modal>
      )}

      {completeTripId && (
        <Modal title="Completar Viaje" onClose={() => setCompleteTripId(null)}>
          <form onSubmit={handleCompleteTrip} className="space-y-4">
             <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded text-sm mb-4">
                Esta acción marcará el viaje como completado y liberará el camión y al chofer para nuevos despachos.
             </div>
             <div>
               <label className="text-xs text-gray-400">Fecha y Hora Real de Arribo (Opcional, dejar en blanco para tomar hora actual)</label>
               <input type="datetime-local" name="arrivalDateTime" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white mt-1" />
             </div>
             <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-medium mt-4 transition-colors">Confirmar Llegada</button>
          </form>
        </Modal>
      )}

    </div>
  );
}
