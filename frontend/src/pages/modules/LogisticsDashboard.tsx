import React from 'react';
import { Truck, Map, Package, CheckCircle } from 'lucide-react';

export default function LogisticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logística y Rutas</h1>
          <p className="text-sm text-slate-500">Despacho de pedidos, transferencias y control de flotilla.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
            + Nueva Ruta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Rutas Activas</h3>
            <Map className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">8</p>
          <span className="text-xs text-emerald-600 font-medium">3 en tránsito</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Vehículos Disp.</h3>
            <Truck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">4/12</p>
          <span className="text-xs text-slate-500 font-medium">Flotilla propia</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Entregas Hoy</h3>
            <CheckCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">45</p>
          <span className="text-xs text-slate-500 font-medium">De 60 programadas</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-600">Transferencias</h3>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">5</p>
          <span className="text-xs text-slate-500 font-medium">Pendientes entre sucursales</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Rutas en Tránsito</h2>
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">Ruta Norte 01</h3>
                  <p className="text-xs text-slate-500">Vehículo: T-01 (Ram 4000) • Chofer: Luis M.</p>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                  En Ruta
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>12/20 Entregas</span>
                <span>ETA: 14:30</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">Transferencia Matriz - Sur</h3>
                  <p className="text-xs text-slate-500">Vehículo: F-03 (F-350) • Chofer: Pedro G.</p>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                  En Ruta
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>0/1 Entregas</span>
                <span>ETA: 16:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Entregas Recientes</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">Pedido #ORD-2023</p>
                  <p className="text-xs text-slate-500">Cliente: Hospital Ángeles</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Hace 10 min</span>
            </div>
            <div className="flex justify-between items-center p-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">Pedido #ORD-2022</p>
                  <p className="text-xs text-slate-500">Cliente: Ferretería El Clavo</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Hace 45 min</span>
            </div>
            <div className="flex justify-between items-center p-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">Transferencia TRF-091</p>
                  <p className="text-xs text-slate-500">Destino: Sucursal Centro</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Hace 2 hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
