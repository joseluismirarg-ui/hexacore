import React, { useEffect, useState, useMemo } from 'react';
import { Users, TrendingUp, AlertTriangle, Search, Plus, Edit2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { BulkImportButton } from '@/components/ui/BulkImportButton';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency, clientesApi, ApiError } from '@/lib/api';

interface Customer {
  id: string;
  companyName: string;
  rfc?: string;
  email?: string;
  phone?: string;
  creditLimit: string;
  currentDebt: string;
  creditDays?: number;
}

function CreditBar({ debt, limit }: { debt: string; limit: string }) {
  const pct = Number(limit) > 0 ? (Number(debt) / Number(limit)) * 100 : 0;
  const color =
    pct >= 90 ? 'bg-hc-coral' : pct >= 60 ? 'bg-amber-400' : 'bg-hc-emerald';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-hc-surface-dark">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${pct >= 90 ? 'text-hc-coral' : pct >= 60 ? 'text-amber-400' : 'text-hc-emerald'}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export function DirectorioClientes() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    companyName: '',
    rfc: '',
    email: '',
    phone: '',
    creditLimit: '0',
    creditDays: '0'
  });

  const load = async () => {
    try {
      setIsLoading(true);
      const res = await clientesApi.listar() as any;
      setCustomers(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = (customer: Customer) => {
    setFormData({
      id: customer.id,
      companyName: customer.companyName,
      rfc: customer.rfc || '',
      email: customer.email || '',
      phone: customer.phone || '',
      creditLimit: customer.creditLimit.toString(),
      creditDays: (customer.creditDays || 0).toString()
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCreate = () => {
    setFormData({ id: '', companyName: '', rfc: '', email: '', phone: '', creditLimit: '0', creditDays: '0' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        companyName: formData.companyName,
        rfc: formData.rfc,
        email: formData.email,
        phone: formData.phone,
        creditLimit: Number(formData.creditLimit),
        creditDays: Number(formData.creditDays)
      };

      if (isEditing) {
        await clientesApi.actualizar(formData.id, payload);
      } else {
        await clientesApi.crear(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al guardar el cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<Column<Customer>[]>(() => [
    {
      header: 'Empresa',
      accessor: 'companyName',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-100">{row?.companyName}</p>
          {row?.rfc && <p className="font-mono text-xxs text-gray-500">{row?.rfc}</p>}
        </div>
      ),
    },
    {
      header: 'Contacto',
      accessor: 'email',
      render: (row) => (
        <div className="text-xs text-gray-400">
          {row?.email && <p>{row?.email}</p>}
          {row?.phone && <p>{row?.phone}</p>}
          {!row?.email && !row?.phone && <span className="text-gray-600">—</span>}
        </div>
      ),
    },
    {
      header: 'Límite Crédito',
      accessor: 'creditLimit',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-gray-300">
          {formatCurrency(row?.creditLimit)}
        </span>
      ),
    },
    {
      header: 'Días',
      accessor: 'creditDays',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-sm text-gray-400">
          {row?.creditDays || 0}
        </span>
      ),
    },
    {
      header: 'Deuda Actual',
      accessor: 'currentDebt',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span
          className={`font-mono text-sm font-semibold ${
            Number(row?.currentDebt || 0) > 0 ? 'text-hc-coral-light' : 'text-hc-emerald'
          }`}
        >
          {formatCurrency(row?.currentDebt)}
        </span>
      ),
    },
    {
      header: 'Utilización',
      accessor: 'creditLimit',
      render: (row) => <CreditBar debt={row?.currentDebt || '0'} limit={row?.creditLimit || '0'} />,
    },
    {
      header: 'Estado',
      accessor: 'currentDebt',
      render: (row) => {
        const pct = Number(row?.creditLimit || 0) > 0
          ? (Number(row?.currentDebt || 0) / Number(row?.creditLimit || 0)) * 100
          : 0;
        if (pct >= 90) return <Badge variant="coral" dot size="sm">Bloqueado</Badge>;
        if (pct >= 60) return <Badge variant="amber" dot size="sm">Próximo a vencer</Badge>;
        return <Badge variant="emerald" dot size="sm">Al corriente</Badge>;
      },
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

  const filtered = (customers || []).filter((c) =>
    search === '' ||
    (c?.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c?.rfc || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalDeuda = (customers || []).reduce((s, c) => s + Number(c?.currentDebt || 0), 0);
  const conDeuda = (customers || []).filter((c) => Number(c?.currentDebt || 0) > 0).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Directorio de Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">CRM · Cartera y crédito B2B</p>
        </div>
        <div className="flex gap-3">
          <BulkImportButton
            endpoint="/api/bulk-import/customers"
            onSuccess={() => refetch()}
            label="Importar Clientes"
          />
          <Button variant="primary" onClick={handleCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-hc-surface" />
          ))
        ) : (
          <>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-cobalt/15">
                <Users className="h-5 w-5 text-hc-cobalt-light" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Total clientes</p>
                <p className="text-2xl font-bold text-gray-100">{customers.length}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-coral/10">
                <AlertTriangle className="h-5 w-5 text-hc-coral" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Con deuda activa</p>
                <p className="text-2xl font-bold text-hc-coral">{conDeuda}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hc-emerald/10">
                <TrendingUp className="h-5 w-5 text-hc-emerald" />
              </div>
              <div>
                <p className="text-xxs text-gray-500 uppercase tracking-wider">Deuda total</p>
                <p className="text-xl font-bold text-hc-emerald">{formatCurrency(totalDeuda)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search + Table */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-gray-700/40">
          <div className="max-w-sm">
            <Input
              label=""
              placeholder="Buscar empresa o RFC..."
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
            emptyMessage="Sin clientes registrados"
          />
        )}
      </div>

      {/* Modal Crear/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-hc-surface p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700/50">
            <h2 className="text-xl font-bold mb-4 text-gray-100">
              {isEditing ? 'Editar Cliente' : 'Crear Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">Empresa / Nombre Comercial</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">RFC (Opcional)</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.rfc}
                  onChange={e => setFormData({ ...formData, rfc: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Correo (Opcional)</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Teléfono (Opcional)</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Límite Crédito ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={formData.creditLimit}
                    onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Días de Crédito</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input-field"
                    value={formData.creditDays}
                    onChange={e => setFormData({ ...formData, creditDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" loading={submitting}>
                  {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
