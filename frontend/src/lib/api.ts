// =============================================================================
// HEXA CORE SYSTEMS — frontend/src/lib/api.ts v2.0
// Capa de servicios de red. Todos los campos financieros viajan como string.
// =============================================================================

/// <reference types="vite/client" />
import type { ApiResponse } from '@/types/models';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  customHeaders?: Record<string, string>
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = localStorage.getItem('hexa_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isTransactionPost = method === 'POST' && path.includes('/transacciones');
  if (isTransactionPost && !headers['Idempotency-Key']) {
    headers['Idempotency-Key'] = crypto.randomUUID();
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({
    success: false,
    code: 'PARSE_ERROR',
    message: 'Error al parsear respuesta del servidor',
  }));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      json.code ?? 'UNKNOWN',
      json.message ?? `Error HTTP ${response.status}`,
      json.errors
    );
  }

  return json as ApiResponse<T>;
}

// ── Métodos públicos ─────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>('POST', path, body, headers),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// ── Helpers de formato ───────────────────────────────────────────────────────

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value);
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

// ── Servicios de API tipados por módulo ─────────────────────────────────────

// Auth
export const authApi = {
  login: (body: unknown) => api.post('/api/auth/login', body),
};

// Productos
export const productosApi = {
  listar: (q?: string) =>
    api.get<{ data: unknown[]; pagination: unknown }>(
      `/api/products${q ? `?q=${encodeURIComponent(q)}` : ''}`
    ),
  crear: (body: unknown) => api.post('/api/products', body),
  actualizar: (id: string, body: unknown) => api.patch(`/api/products/${id}`, body),
  eliminar: (id: string) => api.delete(`/api/products/${id}`),
};

// Clientes
export const clientesApi = {
  listar: () => api.get('/api/customers'),
  consignaciones: () => api.get('/api/customers/consignaciones'),
  crear: (body: unknown) => api.post('/api/customers', body),
};

// Transacciones (POS)
export const transaccionesApi = {
  registrar: (body: unknown) => api.post('/api/transactions/registrar', body),
  listar: (params?: string) => api.get(`/api/transactions${params ? `?${params}` : ''}`),
};

// Inventario / Kardex
export const inventarioApi = {
  almacenes: () => api.get('/api/inventory/almacenes'),
  camiones: () => api.get('/api/inventory/camiones'),
  liquidacion: (id: string) => api.get(`/api/inventory/camiones/${id}/liquidacion`),
  traspaso: (body: unknown) => api.post('/api/inventory/traspaso', body),
  kardex: (productId?: string, tipo?: string) => {
    if (productId) return api.get(`/api/inventory/kardex/${productId}`);
    const qs = tipo ? `?tipo=${tipo}` : '';
    return api.get(`/api/inventory/kardex${qs}`);
  },
};

// Pagos / CxC
export const pagosApi = {
  registrar: (body: unknown) => api.post('/api/payments', body),
  byCliente: (customerId: string) => api.get(`/api/payments/cliente/${customerId}`),
};

// Cobranza
export const cobranzaApi = {
  conDeuda: () => api.get('/api/collections'),
  estadoCuenta: (customerId: string) => api.get(`/api/collections/${customerId}`),
  abonar: (body: unknown) => api.post('/api/collections/abonar', body),
};

// Compras / CxP
export const comprasApi = {
  proveedores: () => api.get('/api/purchases/proveedores'),
  crearProveedor: (body: unknown) => api.post('/api/purchases/proveedores', body),
  listar: (status?: string) =>
    api.get(`/api/purchases${status ? `?status=${status}` : ''}`),
  crear: (body: unknown) => api.post('/api/purchases', body),
  recibir: (id: string, body: unknown) => api.post(`/api/purchases/${id}/recibir`, body),
};

// Usuarios
export const usuariosApi = {
  vendedores: () => api.get('/api/users/vendedores'),
  listar: () => api.get('/api/users'),
  crear: (body: unknown) => api.post('/api/users', body),
  actualizar: (id: string, body: unknown) => api.put(`/api/users/${id}`, body),
  suspender: (id: string) => api.patch(`/api/users/${id}/suspend`, {}),
};

// Facturas CFDI
export const facturasApi = {
  listar: (params?: string) => api.get(`/api/invoices${params ? `?${params}` : ''}`),
  timbrar: (body: unknown) => api.post('/api/invoices/timbrar', body),
  cancelar: (id: string) => api.patch(`/api/invoices/${id}/cancelar`, {}),
};

// Almacenes Centrales
export const warehousesApi = {
  listar: () => api.get('/api/warehouses'),
  crear: (body: unknown) => api.post('/api/warehouses', body),
  dashboard: (id: string) => api.get(`/api/warehouses/${id}/dashboard`),
};

// Recursos Humanos
export const hrApi = {
  attendance: (body: unknown) => api.post('/api/hr/attendance', body),
  payroll: (period?: string) => api.get(`/api/hr/payroll${period ? `?period=${period}` : ''}`),
};

// Configuración del Sistema
export const configApi = {
  get: () => api.get('/api/config'),
  update: (body: unknown) => api.put('/api/config', body),
};
