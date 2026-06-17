import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { api, formatCurrency, formatTimestamp } from '../lib/api';

export default function SuperAdminPanel() {
  const { data: licenseData, loading: loadingLicense, execute: reloadLicense } = useAsync(() => api.get('/api/admin/licenses'), true);
  const { data: usersData, loading: loadingUsers } = useAsync(() => api.get('/api/users'), true);
  const { data: statsData, loading: loadingStats } = useAsync(() => api.get('/api/dashboard'), true);

  const license: any = (licenseData as any)?.data || {};
  const users: any[] = (usersData as any)?.data || [];
  const stats: any = (statsData as any)?.data || {};

  const [activeTab, setActiveTab] = useState<'licencias' | 'usuarios' | 'sistema'>('licencias');
  const [toggling, setToggling] = useState(false);

  const handleToggleLicense = async (key: string, currentValue: boolean) => {
    if (toggling) return;
    setToggling(true);
    try {
      await api.put('/api/admin/licenses', { [key]: !currentValue });
      await reloadLicense();
    } catch (error) {
      alert('Error al actualizar licencia');
    } finally {
      setToggling(false);
    }
  };

  const modules = [
    { key: 'erpActive', label: 'ERP Core', desc: 'Productos, Inventario, Clientes' },
    { key: 'posActive', label: 'Punto de Venta', desc: 'Ventas, Consignaciones, Liquidaciones' },
    { key: 'hrActive', label: 'Recursos Humanos', desc: 'Asistencia, Nómina, Comisiones' },
    { key: 'billingActive', label: 'Facturación CFDI', desc: 'Timbrado y Cancelación SAT' },
    { key: 'logisticsActive', label: 'Logística', desc: 'Traspasos entre Almacenes' },
    { key: 'manufacturingActive', label: 'Manufactura', desc: 'Recetas BOM, Producción' },
    { key: 'treasuryActive', label: 'Tesorería', desc: 'Cuentas Bancarias, Movimientos' },
    { key: 'reportsActive', label: 'Reportes Avanzados', desc: 'Exportación CSV, Dashboards' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Super Administrador</h1>
        <p className="text-muted-foreground">Control total del sistema, licencias y módulos activos.</p>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {(['licencias', 'usuarios', 'sistema'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab === 'licencias' ? 'Módulos / Licencias' : tab === 'usuarios' ? 'Usuarios del Sistema' : 'Estado del Sistema'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'licencias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <div key={mod.key} className={`rounded-xl border p-5 transition-all ${license[mod.key] ? 'bg-green-500/5 border-green-500/30' : 'bg-card border-border opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{mod.label}</h3>
                <button
                  onClick={() => handleToggleLicense(mod.key, license[mod.key])}
                  disabled={toggling}
                  className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${license[mod.key] ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                >
                  {license[mod.key] ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{mod.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="rounded-md border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u: any) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">{u.name || u.username}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${u.isActive !== false ? 'text-green-400' : 'text-red-400'}`}>
                      {u.isActive !== false ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No hay usuarios registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sistema' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-xs uppercase text-muted-foreground font-semibold mb-2">Ventas del Mes</h3>
            <p className="text-2xl font-bold">{formatCurrency(stats?.totalSalesMonth?.toString() || '0')}</p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-xs uppercase text-muted-foreground font-semibold mb-2">Inventario Global</h3>
            <p className="text-2xl font-bold">{stats?.totalStock?.toLocaleString?.() || 0} unidades</p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-xs uppercase text-muted-foreground font-semibold mb-2">Deuda Acumulada</h3>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(stats?.totalDebt?.toString() || '0')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
