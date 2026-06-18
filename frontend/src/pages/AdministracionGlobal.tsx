import React, { useState, useEffect } from 'react';
import { useAsync } from '../lib/hooks';
import { usuariosApi, configApi } from '../lib/api';

export default function AdministracionGlobal() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'config'>('usuarios');

  // Usuarios
  const { data: usersData, loading: loadingUsers, execute: loadUsers } = useAsync(() => usuariosApi.listar());
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'VENDEDOR' });

  // Configuración
  const { data: configData, loading: loadingConfig, execute: loadConfig } = useAsync(() => configApi.get());
  const [configForm, setConfigForm] = useState({ companyName: '', companyRfc: '', taxRegimen: '', posTimeout: 300 });

  useEffect(() => {
    const config = (configData as any)?.data;
    if (config) {
      setConfigForm({
        companyName: config.companyName,
        companyRfc: config.companyRfc,
        taxRegimen: config.taxRegimen,
        posTimeout: config.posTimeout
      });
    }
  }, [configData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usuariosApi.crear(userForm);
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'VENDEDOR' });
      loadUsers();
    } catch (err) {
      alert('Error al crear usuario');
    }
  };

  const handleSuspendUser = async (id: string) => {
    if (!confirm('¿Deseas suspender a este usuario?')) return;
    try {
      await usuariosApi.suspender(id);
      loadUsers();
    } catch (error) {
      alert('Error al suspender');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configApi.update(configForm);
      alert('Configuración guardada exitosamente');
      loadConfig();
    } catch (error) {
      alert('Error al guardar configuración');
    }
  };

  const users: any[] = (usersData as any)?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administración Global</h1>
        <p className="text-muted-foreground">Configuración del sistema y gestión de accesos.</p>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'usuarios'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Usuarios y Roles
          </button>
          <button
            onClick={() => { setActiveTab('config'); loadConfig(); }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Configuración General
          </button>
        </nav>
      </div>

      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              + Nuevo Usuario
            </button>
          </div>

          <div className="rounded-md border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Rol</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className={`border-b last:border-0 ${!user.isActive ? 'bg-muted/30 opacity-60' : 'hover:bg-muted/50'}`}>
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-semibold">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {user.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.isActive && (
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Suspender
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-hc-surface p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700/50">
                <h2 className="text-xl font-bold mb-4">Crear Usuario</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={userForm.name}
                      onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      value={userForm.email}
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña Inicial</label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      value={userForm.password}
                      onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol en el Sistema</label>
                    <select
                      className="input-field"
                      value={userForm.role}
                      onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      <option value="ADMIN">Administrador General (ADMIN)</option>
                      <option value="VENDEDOR">Vendedor (POS / Ruta)</option>
                      <option value="ALMACENISTA">Almacenista (Inventarios)</option>
                      <option value="RH">Recursos Humanos (RH)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="px-4 py-2 border rounded-md hover:bg-accent"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      Crear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="max-w-2xl bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">Parámetros Operativos e Impuestos</h2>
          {loadingConfig && <p>Cargando configuración...</p>}
          
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Razón Social o Nombre Comercial</label>
                <input
                  type="text"
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={configForm.companyName}
                  onChange={e => setConfigForm({ ...configForm, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RFC Institucional</label>
                <input
                  type="text"
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
                  value={configForm.companyRfc}
                  onChange={e => setConfigForm({ ...configForm, companyRfc: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Régimen Fiscal (Clave SAT)</label>
                <input
                  type="text"
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={configForm.taxRegimen}
                  onChange={e => setConfigForm({ ...configForm, taxRegimen: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeout de Sesión POS (segundos)</label>
                <input
                  type="number"
                  min={60}
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={configForm.posTimeout}
                  onChange={e => setConfigForm({ ...configForm, posTimeout: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="pt-4 border-t flex justify-end">
              <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
