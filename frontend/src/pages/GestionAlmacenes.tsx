import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { warehousesApi } from '../lib/api';

export default function GestionAlmacenes() {
  const { data, loading, error, execute } = useAsync(() => warehousesApi.listar());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', location: '' });
  const [auditWarehouse, setAuditWarehouse] = useState<any>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await warehousesApi.crear(formData);
      setShowModal(false);
      setFormData({ name: '', code: '', location: '' });
      execute();
    } catch (err: any) {
      alert(err.message || 'Error al crear almacén');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el almacén "${name}"?`)) return;
    try {
      await warehousesApi.eliminar(id);
      execute();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar almacén');
    }
  };

  const almacenes: any[] = (data as any)?.data || [];

  const handleStartAudit = (warehouse: any) => {
    // Aquí se llamaría a API /api/v1/warehouse/audit/start
    // Para la demo del frontend, solo mostramos el modal simulado
    setAuditWarehouse(warehouse);
  };

  const handleCompleteAudit = () => {
    // Aquí se llamaría a API /api/v1/warehouse/audit/complete
    alert(`Auditoría completada para ${auditWarehouse.name}. El Kardex ha sido actualizado transaccionalmente.`);
    setAuditWarehouse(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Almacenes</h1>
          <p className="text-muted-foreground">Control centralizado de infraestructura.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          + Nuevo Almacén
        </button>
      </div>

      {loading && <p>Cargando almacenes...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(almacenes || []).map((almacen) => (
          <div key={almacen.id} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold">{almacen.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">Código: {almacen.code}</p>
            <p className="text-sm text-muted-foreground">Ubicación: {almacen.location || 'N/A'}</p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SKUs almacenados:</span>
                <span className="font-medium">{almacen?._count?.warehouseStocks || 0}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => handleStartAudit(almacen)}
                className="w-full rounded-md bg-hc-cobalt/10 px-4 py-2 text-sm font-medium text-hc-cobalt transition-colors hover:bg-hc-cobalt/20"
              >
                Conteo Cíclico
              </button>
              <button 
                onClick={() => handleDelete(almacen.id, almacen.name)}
                className="rounded-md border border-hc-coral/30 bg-hc-coral/10 px-4 py-2 text-sm font-medium text-hc-coral transition-colors hover:bg-hc-coral/20"
                title="Eliminar Almacén"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
        {almacenes.length === 0 && !loading && (
          <p className="col-span-full text-center text-muted-foreground py-8">
            No hay almacenes registrados.
          </p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md border border-border">
            <h2 className="text-xl font-bold mb-4">Registrar Almacén</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código</label>
                <input
                  type="text"
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ubicación</label>
                <input
                  type="text"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
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

      {/* MODAL AUDITORÍA DE INVENTARIO */}
      {auditWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-hc-surface p-6 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-2 text-gray-50">Conteo Cíclico: {auditWarehouse.name}</h2>
            <p className="text-sm text-gray-400 mb-6">
              Registra el conteo físico. Las discrepancias se ajustarán automáticamente en el Kardex.
            </p>
            
            <div className="space-y-4 mb-6">
              {/* Mock table of products to count */}
              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-800/50 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Esperado</th>
                      <th className="px-4 py-3">Físico</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/50">
                      <td className="px-4 py-3 text-gray-200">GEN-01</td>
                      <td className="px-4 py-3">100</td>
                      <td className="px-4 py-3">
                        <input type="number" defaultValue="100" className="w-20 rounded bg-gray-900 px-2 py-1 border border-gray-600 focus:border-hc-cobalt focus:outline-none" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setAuditWarehouse(null)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCompleteAudit}
                className="px-4 py-2 bg-hc-emerald text-white rounded-md hover:bg-hc-emerald-light"
              >
                Cerrar Auditoría y Ajustar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
