import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { hrApi, formatCurrency } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Users, CalendarCheck, MapPin, DollarSign, Loader2 } from 'lucide-react';
import DirectorioEmpleados from './hr/DirectorioEmpleados';
import PanelAsistencia from './hr/PanelAsistencia';
import ControlRutas from './hr/ControlRutas';

export default function RecursosHumanos() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reloj' | 'asistencia' | 'empleados' | 'rutas' | 'nomina'>('reloj');
  const [periodo, setPeriodo] = useState('2026-06');
  
  const { data: nominaData, loading: loadingNomina, execute: loadNomina } = useAsync(() => hrApi.payroll(periodo), false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autorización
  const isHRManager = user?.role === 'ADMIN' || user?.role === 'RH';

  const handleCheckInOut = async () => {
    try {
      setIsSubmitting(true);
      const response = await hrApi.attendance({ userId: user?.id });
      const action = (response as any).data?.checkOut ? 'checkout' : 'checkin';
      setActionStatus(action === 'checkin' ? 'Entrada registrada exitosamente.' : 'Salida registrada exitosamente.');
      setTimeout(() => setActionStatus(null), 3000);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar asistencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadNomina = () => {
    loadNomina();
  };

  const payrolls: any[] = (nominaData as any)?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recursos Humanos</h1>
        <p className="text-muted-foreground">Control de personal, asistencia, nómina y rutas.</p>
      </div>

      <div className="border-b border-border overflow-x-auto">
        <nav className="-mb-px flex space-x-6 min-w-max">
          <button
            onClick={() => setActiveTab('reloj')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'reloj'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Clock className="w-4 h-4" /> Reloj Checador
          </button>

          {isHRManager && (
            <>
              <button
                onClick={() => setActiveTab('empleados')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'empleados'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Users className="w-4 h-4" /> Directorio Empleados
              </button>
              
              <button
                onClick={() => setActiveTab('asistencia')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'asistencia'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <CalendarCheck className="w-4 h-4" /> Panel Asistencia
              </button>

              <button
                onClick={() => setActiveTab('rutas')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'rutas'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <MapPin className="w-4 h-4" /> Control de Rutas
              </button>

              <button
                onClick={() => { setActiveTab('nomina'); handleLoadNomina(); }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'nomina'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <DollarSign className="w-4 h-4" /> Nómina / Comisiones
              </button>
            </>
          )}
        </nav>
      </div>

      {/* ── CONTENIDO DE LAS PESTAÑAS ── */}
      
      {activeTab === 'reloj' && (
        <div className="max-w-md mx-auto mt-12 bg-card border rounded-xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Asistencia del Día</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            {user?.name}, registra tu entrada al comenzar la jornada y tu salida al finalizarla.
          </p>
          <button
            onClick={handleCheckInOut}
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Registrar Entrada / Salida'}
          </button>
          {actionStatus && (
            <div className="mt-6 p-4 rounded bg-green-500/10 text-green-600 font-medium border border-green-500/20">
              {actionStatus}
            </div>
          )}
        </div>
      )}

      {activeTab === 'empleados' && isHRManager && <DirectorioEmpleados />}
      {activeTab === 'asistencia' && isHRManager && <PanelAsistencia />}
      {activeTab === 'rutas' && isHRManager && <ControlRutas />}

      {activeTab === 'nomina' && isHRManager && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Periodo:</label>
              <input
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                onClick={handleLoadNomina}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 text-sm font-medium"
              >
                Calcular
              </button>
            </div>
          </div>

          {loadingNomina ? (
            <p className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Calculando nómina...</p>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3">Periodo</th>
                    <th className="px-6 py-3 text-right">Sueldo Base</th>
                    <th className="px-6 py-3 text-right">Bonos y Comisiones</th>
                    <th className="px-6 py-3 text-right text-primary font-bold">Total a Pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p: any) => (
                    <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{p.userName}</td>
                      <td className="px-6 py-4">{p.period}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(p.baseSalary)}</td>
                      <td className="px-6 py-4 text-right text-green-500 font-medium">
                        + {formatCurrency(p.commissions)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-base">
                        {formatCurrency(p.totalPaid)}
                      </td>
                    </tr>
                  ))}
                  {payrolls.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No hay datos de nómina para el periodo seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
