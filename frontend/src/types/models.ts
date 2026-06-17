// =============================================================================
// HEXA CORE SYSTEMS — Frontend Type Definitions
// Interfaces espejo del schema Prisma. Todos los campos Decimal del backend
// llegan como string vía JSON — se formatean en el frontend para display.
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'ADMINISTRADOR' | 'VENDEDOR_RUTA';

export type LocationType = 'CENTRAL' | 'MOVIL' | 'CONSIGNACION_CLIENTE';

export type TransactionType = 'VENTA_DIRECTA' | 'CREDITO' | 'CONSIGNACION';

export type TransactionStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

// ── Models ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Customer {
  id: string;
  companyName: string;
  creditLimit: string;   // Decimal(14,2) → string en JSON
  currentDebt: string;   // Decimal(14,2) → string en JSON
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  cost: string;          // Decimal(14,4) → string
  price: string;         // Decimal(14,4) → string
  globalStock: number;
}

export interface InventoryLocation {
  id: string;
  name: string;
  tipo: LocationType;
  customerId?: string | null;
  customer?: Customer;
}

export interface InventoryStock {
  id: string;
  quantity: number;
  updatedAt: string;
  locationId: string;
  productId: string;
  product?: Product;
  location?: InventoryLocation;
}

export interface TransactionItem {
  id: string;
  cantidad: number;
  precioAplicado: string; // Decimal(14,4) → string
  transactionId: string;
  productId: string;
  product?: Pick<Product, 'id' | 'sku' | 'name'>;
}

export interface Transaction {
  id: string;
  uuid: string;
  tipo: TransactionType;
  status: TransactionStatus;
  total: string;         // Decimal(14,2) → string
  createdAt: string;
  userId: string;
  customerId: string;
  items?: TransactionItem[];
  user?: Pick<User, 'id' | 'name'>;
  customer?: Pick<Customer, 'id' | 'companyName'>;
  _count?: { items: number };
}

export interface AuditLog {
  id: string;
  accion: string;
  detalles: Record<string, unknown>;
  timestamp: string;
  userId: string;
  user?: Pick<User, 'id' | 'name'>;
}

// ── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  idempotent?: boolean;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Dashboard-specific types ─────────────────────────────────────────────────

export interface DashboardMetric {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  color: 'cobalt' | 'emerald' | 'coral';
}

export interface WeeklyFlowData {
  dia: string;
  ventas: number;
  cobros: number;
}

// ── Consignación-specific types ──────────────────────────────────────────────

export interface ConsignacionSKU {
  product: Pick<Product, 'id' | 'sku' | 'name' | 'price'>;
  cantidad: number;
}

export interface ConsignacionCliente {
  customer: Customer;
  skusConsignados: ConsignacionSKU[];
  estado: 'al_corriente' | 'proximo_vencer' | 'bloqueado';
  porcentajeUtilizado: number;
}

// ── Liquidación-specific types ───────────────────────────────────────────────

export interface ProductoConciliacion {
  product: Pick<Product, 'id' | 'sku' | 'name' | 'price'>;
  cargado: number;
  devuelto: number;
  vendido: number;
  montoEsperado: number;
}

export interface LiquidacionData {
  vendedor: User;
  camion: InventoryLocation;
  productos: ProductoConciliacion[];
  efectivoEsperado: number;
  efectivoEntregado: number;
  discrepancia: number;
}
