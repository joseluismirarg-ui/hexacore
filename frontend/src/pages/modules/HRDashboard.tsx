import React from 'react';
import { Users, Clock, Calendar, FileText } from 'lucide-react';

export default function HRDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recursos Humanos</h1>
          <p className="text-sm text-slate-500">Gestión de personal, nóminas y asistencia.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
            + Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Plantilla Activa</h3>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">24</p>
          <span className="text-xs text-emerald-600 font-medium">+2 este mes</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Asistencia Hoy</h3>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">22/24</p>
          <span className="text-xs text-slate-500 font-medium">92% presentes</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Vacaciones</h3>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">3</p>
          <span className="text-xs text-amber-600 font-medium">Pendientes de aprobar</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Nómina (Periodo)</h3>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">$124,500</p>
          <span className="text-xs text-slate-500 font-medium">Cierre en 2 días</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Solicitudes Pendientes</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
              <div>
                <p className="font-medium text-slate-900 text-sm">Vacaciones Anuales</p>
                <p className="text-xs text-slate-500">Carlos Mendoza • 5 días</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded font-medium hover:bg-emerald-100">Aprobar</button>
                <button className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded font-medium hover:bg-rose-100">Rechazar</button>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
              <div>
                <p className="font-medium text-slate-900 text-sm">Permiso Médico</p>
                <p className="text-xs text-slate-500">Ana García • 1 día</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded font-medium hover:bg-emerald-100">Aprobar</button>
                <button className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded font-medium hover:bg-rose-100">Rechazar</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Asistencia Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Roberto Juárez (Almacén)</p>
                <p className="text-xs text-slate-500">Entrada: 08:00 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Lucía Torres (Ventas)</p>
                <p className="text-xs text-slate-500">Entrada: 08:15 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Mario Silva (Reparto)</p>
                <p className="text-xs text-slate-500">Entrada: 09:30 AM (Retardo)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
