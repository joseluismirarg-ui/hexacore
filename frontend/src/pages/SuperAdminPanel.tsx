import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { api, formatCurrency, formatTimestamp } from '../lib/api';

export default function SuperAdminPanel() {
  const { data: licenseData, loading: loadingLicense, execute: reloadLicense } = useAsync(() => api.get('/api/admin/licenses'), true);
  const { data: usersData, loading: loadingUsers } = useAsync(() => api.get('/api/users'), true);
  const { data: statsData, loading: loadingStats } = useAsync(() => api.get('/api/dashboard'), true);
  const { data: tenantsData, loading: loadingTenants } = useAsync(() => api.get('/api/admin/tenants'), true);

  const license: any = (licenseData as any)?.data || {};
  const users: any[] = (usersData as any)?.data || [];
  const stats: any = (statsData as any)?.data || {};
  const tenants: any[] = (tenantsData as any)?.data || [];

  const [activeTab, setActiveTab] = useState<'licencias' | 'usuarios' | 'sistema' | 'empresas'>('licencias');
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
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {(['empresas', 'licencias', 'usuarios', 'sistema'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab === 'empresas' ? 'Empresas SaaS' : tab === 'licencias' ? 'Módulos / Licencias' : tab === 'usuarios' ? 'Usuarios del Sistema' : 'Estado del Sistema'}
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

      {activeTab === 'empresas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((t: any) => {
              const sysConfig = t.systemConfigs?.[0] || {};
              const userCount = t.users?.length || 0;
              return (
                <div key={t.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <p className="text-xs text-muted-foreground">{t.industry} • Plan: {t.plan}</p>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${t.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {t.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex justify-between"><span className="font-medium">RFC:</span> <span>{sysConfig.companyRfc || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Usuarios:</span> <span>{userCount} cuentas</span></div>
                    <div className="flex justify-between"><span className="font-medium">Creado:</span> <span>{formatTimestamp(t.createdAt)}</span></div>
                  </div>

                  <div className="mt-6 pt-4 border-t flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          const res = await api.post(`/api/admin/impersonate/${t.id}`);
                          if (res.data?.token) {
                            localStorage.setItem('hexa_token', res.data.token);
                            window.location.href = '/dashboard';
                          }
                        } catch(e) { alert('Error al acceder al panel'); }
                      }}
                      className="flex-1 bg-primary text-primary-foreground py-2 text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Acceder al Panel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {tenants.length === 0 && (
            <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
              No hay empresas registradas aún.
            </div>
          )}
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
