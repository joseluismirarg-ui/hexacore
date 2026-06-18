import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { comprasApi } from '../lib/api';

export default function DirectorioProveedores() {
  const { data, loading, error, execute } = useAsync(() => comprasApi.proveedores());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', rfc: '', email: '', phone: '', address: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await comprasApi.crearProveedor(formData);
      setShowModal(false);
      setFormData({ name: '', rfc: '', email: '', phone: '', address: '' });
      execute();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Error al crear proveedor');
    }
  };

  const proveedores: any[] = (data as any)?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Directorio de Proveedores</h1>
          <p className="text-muted-foreground">Gestión de socios comerciales y cuentas por pagar.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          + Nuevo Proveedor
        </button>
      </div>

      {loading && <p>Cargando proveedores...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted text-muted-foreground">
            <tr>
              <th className="px-6 py-3">Razón Social</th>
              <th className="px-6 py-3">RFC</th>
              <th className="px-6 py-3">Contacto</th>
              <th className="px-6 py-3">Dirección</th>
              <th className="px-6 py-3 text-right">Órdenes</th>
            </tr>
          </thead>
          <tbody>
            {(proveedores || []).map((proveedor) => (
              <tr key={proveedor.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-6 py-4 font-medium">{proveedor.name}</td>
                <td className="px-6 py-4">{proveedor.rfc}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span>{proveedor.email || '—'}</span>
                    <span className="text-muted-foreground text-xs">{proveedor.phone || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{proveedor.address || '—'}</td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {proveedor?._count?.purchaseOrders || 0}
                  </span>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No hay proveedores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md border border-border">
            <h2 className="text-xl font-bold mb-4">Registrar Proveedor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Razón Social</label>
                <input
                  type="text"
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RFC</label>
                <input
                  type="text"
                  required
                  minLength={12}
                  maxLength={13}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                  value={formData.rfc}
                  onChange={e => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección (Opcional)</label>
                <input
                  type="text"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
