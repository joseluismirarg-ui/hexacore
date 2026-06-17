import React from 'react';
import { Target, MessageSquare, Phone, TrendingUp } from 'lucide-react';

export default function CRMDashboard() {
  const stages = [
    { id: 'lead', title: 'Leads Nuevos', count: 12, color: 'bg-slate-100 border-slate-200' },
    { id: 'contacted', title: 'Contactados', count: 8, color: 'bg-blue-50 border-blue-100' },
    { id: 'proposal', title: 'Propuesta Enviada', count: 5, color: 'bg-amber-50 border-amber-100' },
    { id: 'won', title: 'Cierre Ganado', count: 24, color: 'bg-emerald-50 border-emerald-100' }
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM & Ventas</h1>
          <p className="text-sm text-slate-500">Gestión de prospectos y embudo de conversión.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
            + Nuevo Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Leads</h3>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">25</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Tasa de Conversión</h3>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">18.5%</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Llamadas Hoy</h3>
            <Phone className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">14</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Correos Enviados</h3>
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">45</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-max h-full pb-4">
          {stages.map((stage) => (
            <div key={stage.id} className={`w-80 rounded-xl border flex flex-col ${stage.color}`}>
              <div className="p-3 border-b border-black/5 flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-slate-800">{stage.title}</h3>
                <span className="bg-white/50 text-slate-600 text-xs px-2 py-1 rounded font-medium">
                  {stage.count}
                </span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {/* Simulated Lead Cards */}
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
                  <h4 className="font-medium text-slate-900 text-sm">Empresa Demo S.A.</h4>
                  <p className="text-xs text-slate-500 mb-2">contacto@demo.com</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Hace 2h</span>
                    <span className="text-xs font-medium text-emerald-600">$50k est.</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
                  <h4 className="font-medium text-slate-900 text-sm">Constructora XYZ</h4>
                  <p className="text-xs text-slate-500 mb-2">ventas@xyz.com</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Ayer</span>
                    <span className="text-xs font-medium text-emerald-600">$120k est.</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
