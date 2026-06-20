import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BulkImportButton } from '@/components/ui/BulkImportButton';
import { formatCurrency, productosApi, ApiError } from '@/lib/api';

// ── Tipos locales ────────────────────────────────────────────────────────────
interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  cost: string;
  price: string;
  globalStock: number;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-hc-surface-dark" />
      ))}
    </div>
  );
}

// ── Modal de creación / edición ───────────────────────────────────────────────
interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductModal({ product, onClose, onSaved }: ProductModalProps) {
  const isEdit = !!product;
  const [sku, setSku] = useState(product?.sku ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  // cost y price se mantienen como string — NUNCA parseFloat
  const [cost, setCost] = useState(product?.cost ?? '');
  const [price, setPrice] = useState(product?.price ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        // PRECISIÓN FINANCIERA: cost y price viajan como string.toString().trim()
        cost: cost.toString().trim(),
        price: price.toString().trim(),
      };

      if (isEdit && product) {
        await productosApi.actualizar(product.id, body);
      } else {
        await productosApi.crear(body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-gray-700/50 bg-hc-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700/40 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-100">
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-hc-surface-dark hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU *"
              placeholder="PROD-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
            <Input
              label="Nombre *"
              placeholder="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Descripción"
            placeholder="Descripción opcional..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Costo unitario *"
              placeholder="0.0000"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
            <Input
              label="Precio de venta *"
              placeholder="0.0000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-hc-coral" />
              <p className="text-xs text-hc-coral">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="md" fullWidth onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" size="md" fullWidth loading={loading} type="submit">
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS PAGE
// ═════════════════════════════════════════════════════════════════════════════
export function CatalogoProductos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  const fetchProducts = useCallback(async (q?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await productosApi.listar(q) as any;
      setProducts(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial — [] estricto
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchProducts(search || undefined);
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [search, fetchProducts]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditProduct(null);
    fetchProducts(search || undefined);
    showToast('Producto guardado correctamente', 'success');
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await productosApi.eliminar(id);
      setDeleteId(null);
      fetchProducts(search || undefined);
      showToast('Producto eliminado', 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Error al eliminar', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Catálogo de Productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            ERP · Gestión de SKUs, costos y precios
          </p>
        </div>
        <div className="flex gap-3">
          <BulkImportButton
            endpoint="/api/bulk-import/items"
            onSuccess={() => fetchProducts(search || undefined)}
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => { setEditProduct(null); setModalOpen(true); }}
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="card flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            label=""
            placeholder="Buscar SKU o nombre..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-gray-500">{products.length} productos</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-hc-coral" />
            <p className="text-sm text-hc-coral">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/40 bg-hc-surface-dark">
                  {['SKU', 'Nombre', 'Costo', 'Precio', 'Stock Global', 'Acciones'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {(products || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                      <Package className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                      Sin productos en el catálogo
                    </td>
                  </tr>
                ) : (
                  (products || []).map((p) => (
                    <tr key={p?.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-hc-cobalt-light">{p?.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-200">{p?.name}</p>
                          {p?.description && (
                            <p className="text-xxs text-gray-500 truncate max-w-[200px]">
                              {p?.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-400">
                        {formatCurrency(p?.cost)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-hc-emerald">
                        {formatCurrency(p?.price)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={p?.globalStock === 0 ? 'coral' : (p?.globalStock ?? 0) < 10 ? 'amber' : 'emerald'}
                          size="sm"
                        >
                          {p?.globalStock ?? 0} uds
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditProduct(p); setModalOpen(true); }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-hc-cobalt/10 hover:text-hc-cobalt-light transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(p?.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-hc-coral/10 hover:text-hc-coral transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de creación/edición */}
      {modalOpen && (
        <ProductModal
          product={editProduct}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal de confirmación de borrado */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-gray-700/50 bg-hc-surface p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-hc-coral/10 mx-auto">
              <Trash2 className="h-6 w-6 text-hc-coral" />
            </div>
            <h3 className="text-center text-lg font-semibold text-gray-100">¿Eliminar producto?</h3>
            <p className="mt-2 text-center text-sm text-gray-400">
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" size="md" fullWidth onClick={() => setDeleteId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="md"
                fullWidth
                loading={deleteLoading}
                onClick={() => handleDelete(deleteId)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl animate-slide-in ${
            toast.type === 'success'
              ? 'border-hc-emerald/30 bg-hc-emerald/10 text-hc-emerald'
              : 'border-hc-coral/30 bg-hc-coral/10 text-hc-coral'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
