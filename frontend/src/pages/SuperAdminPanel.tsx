import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { api, formatCurrency, formatTimestamp } from '../lib/api';
import { Plus, X } from 'lucide-react';

export default function SuperAdminPanel() {
  const { data: usersData, loading: loadingUsers } = useAsync(() => api.get('/api/users'), true);
  const { data: statsData, loading: loadingStats } = useAsync(() => api.get('/api/dashboard'), true);
  const { data: tenantsData, loading: loadingTenants, execute: reloadTenants } = useAsync(() => api.get('/api/admin/tenants'), true);

  const users: any[] = (usersData as any)?.data || [];
  const stats: any = (statsData as any)?.data || {};
  const tenants: any[] = (tenantsData as any)?.data || [];

  const [activeTab, setActiveTab] = useState<'usuarios' | 'sistema' | 'empresas'>('empresas');
  const [toggling, setToggling] = useState(false);

  // Estado para el Modal de Crear Empresa
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', industry: 'GENERAL', plan: 'BASIC', companyRfc: '',
    adminName: '', adminEmail: '', adminPassword: ''
  });

  // Estado para el Modal de Licencias
  const [selectedTenantForModules, setSelectedTenantForModules] = useState<any | null>(null);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/admin/tenants', formData);
      setShowCreateModal(false);
      setFormData({ name: '', industry: 'GENERAL', plan: 'FREE', companyRfc: '', adminName: '', adminEmail: '', adminPassword: '' });
      await reloadTenants();
      alert('Empresa creada exitosamente');
    } catch (error: any) {
      alert(error.message || 'Error al crear la empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLicense = async (tenantId: string, key: string, currentValue: boolean) => {
    if (toggling) return;
    setToggling(true);
    try {
      await api.put(`/api/admin/tenants/${tenantId}/licenses`, { [key]: !currentValue });
      // Update local state to reflect change immediately without full reload
      setSelectedTenantForModules((prev: any) => ({
        ...prev,
        moduleLicense: {
          ...prev.moduleLicense,
          [key]: !currentValue
        }
      }));
      await reloadTenants(); // update background
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
          {(['empresas', 'usuarios', 'sistema'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab === 'empresas' ? 'Empresas SaaS' : tab === 'usuarios' ? 'Usuarios del Sistema' : 'Estado del Sistema'}
            </button>
          ))}
        </nav>
      </div>



      {activeTab === 'empresas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Empresas (Tenants)</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              <Plus size={16} /> Crear Empresa SaaS
            </button>
          </div>

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
                      onClick={() => setSelectedTenantForModules(t)}
                      className="flex-1 bg-secondary text-secondary-foreground py-2 text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors"
                    >
                      Módulos
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await api.post<{ token: string }>(`/api/admin/impersonate/${t.id}`, undefined);
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

          {/* Modal Crear Empresa */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b">
                  <h2 className="text-xl font-bold">Registrar Nueva Empresa SaaS</h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  <form id="createTenantForm" onSubmit={handleCreateTenant} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                        Datos de la Empresa
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Nombre de Empresa *</label>
                          <input required type="text" className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium">RFC</label>
                          <input type="text" className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
                            value={formData.companyRfc} onChange={e => setFormData({...formData, companyRfc: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Industria</label>
                          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})}>
                            <option value="GENERAL">General</option>
                            <option value="RETAIL">Retail / Tienda</option>
                            <option value="CONSTRUCTION">Construcción</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Plan</label>
                          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                            <option value="BASIC">Gratis (Test)</option>
                            <option value="PRO">Profesional</option>
                            <option value="ENTERPRISE">Empresarial</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                        Cuenta del Administrador Principal
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2">
                          <label className="text-sm font-medium">Nombre Completo *</label>
                          <input required type="text" className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
                            value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Correo Electrónico (Login) *</label>
                          <input required type="email" className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
                            value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Contraseña Inicial *</label>
                          <input required type="password" minLength={6} className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
                            value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="p-6 border-t bg-muted/30 flex justify-end gap-3 mt-auto">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-md hover:bg-muted font-medium text-sm">
                    Cancelar
                  </button>
                  <button type="submit" form="createTenantForm" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium text-sm flex items-center gap-2">
                    {isSubmitting ? 'Creando Empresa...' : 'Registrar Empresa'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Gestionar Módulos por Tenant */}
          {selectedTenantForModules && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-4xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b">
                  <div>
                    <h2 className="text-xl font-bold">Gestionar Módulos de la Empresa</h2>
                    <p className="text-sm text-muted-foreground">Configurando licencias para: <span className="font-bold text-foreground">{selectedTenantForModules.name}</span></p>
                  </div>
                  <button onClick={() => setSelectedTenantForModules(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((mod) => {
                      const isActive = selectedTenantForModules?.moduleLicense?.[mod.key];
                      return (
                        <div key={mod.key} className={`rounded-xl border p-5 transition-all ${isActive ? 'bg-green-500/5 border-green-500/30' : 'bg-card border-border opacity-60'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm">{mod.label}</h3>
                            <button
                              onClick={() => handleToggleLicense(selectedTenantForModules.id, mod.key, isActive || false)}
                              disabled={toggling}
                              className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                            >
                              {isActive ? 'ACTIVO' : 'INACTIVO'}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">{mod.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-6 border-t bg-muted/30 flex justify-end gap-3 mt-auto">
                  <button type="button" onClick={() => setSelectedTenantForModules(null)} className="px-4 py-2 border rounded-md hover:bg-muted font-medium text-sm">
                    Cerrar
                  </button>
                </div>
              </div>
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
