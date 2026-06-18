import React, { useEffect, useState, useMemo } from 'react';
import { Users, Search, AlertTriangle, Plus, Edit2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usuariosApi, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Seller {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function DirectorioVendedores() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'VENDEDOR'
  });

  const load = async () => {
    try {
      setIsLoading(true);
      const res = await usuariosApi.vendedores() as any;
      setSellers(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar vendedores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = (seller: Seller) => {
    setFormData({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      password: '',
      role: seller.role
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCreate = () => {
    setFormData({ id: '', name: '', email: '', password: '', role: 'VENDEDOR' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      if (isEditing) {
        await usuariosApi.actualizar(formData.id, payload);
      } else {
        if (!formData.password) {
          throw new Error('La contraseña es obligatoria para un nuevo usuario.');
        }
        await usuariosApi.crear(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Error al guardar el vendedor');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<Column<Seller>[]>(() => [
    {
      header: 'Nombre del Vendedor',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-100">{row?.name}</p>
          <p className="font-mono text-xxs text-gray-500">{row?.id}</p>
        </div>
      ),
    },
    {
      header: 'Contacto',
      accessor: 'email',
      render: (row) => (
        <div className="text-xs text-gray-400">
          {row?.email ? <p>{row?.email}</p> : <span className="text-gray-600">—</span>}
        </div>
      ),
    },
    {
      header: 'Rol',
      accessor: 'role',
      render: (row) => (
        <Badge variant="cobalt" size="sm">{row?.role}</Badge>
      ),
    },
    {
      header: '',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 hover:text-hc-cobalt-light hover:bg-hc-cobalt/10 rounded-md transition-colors">
          <Edit2 className="h-4 w-4" />
        </button>
      ),
    }
  ], []);

  const filtered = (sellers || []).filter((s) =>
    search === '' ||
    (s?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s?.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Directorio de Vendedores</h1>
          <p className="mt-1 text-sm text-gray-500">CRM · Gestión de equipo de ventas</p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Nuevo Vendedor
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-hc-surface" />
          ))
        ) : (
          <div className="card flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-cobalt/15">
              <Users className="h-5 w-5 text-hc-cobalt-light" />
            </div>
            <div>
              <p className="text-xxs text-gray-500 uppercase tracking-wider">Total Vendedores</p>
              <p className="text-2xl font-bold text-gray-100">{sellers.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search + Table */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-gray-700/40">
          <div className="max-w-sm">
            <Input
              label=""
              placeholder="Buscar por nombre o correo..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="h-[400px] animate-pulse bg-hc-surface-dark rounded-b-xl" />
        ) : error ? (
          <div className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-hc-coral" />
            <p className="text-sm text-hc-coral">{error}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            compact
            keyExtractor={(row) => row.id}
            emptyMessage="Sin vendedores registrados"
          />
        )}
      </div>

      {/* Modal Crear/Editar Vendedor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-hc-surface p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700/50">
            <h2 className="text-xl font-bold mb-4 text-gray-100">
              {isEditing ? 'Editar Vendedor' : 'Crear Vendedor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">
                  {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  className="input-field"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Rol</label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="ALMACENISTA">Almacenista</option>
                    <option value="RH">Recursos Humanos</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" loading={submitting}>
                  {isEditing ? 'Guardar Cambios' : 'Crear Vendedor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
