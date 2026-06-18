import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  PackageSearch,
  Calculator,
  Hexagon,
  LogOut,
  ShoppingCart,
  Users,
  ArrowLeftRight,
  CreditCard,
  ShoppingBag,
  FileText,
  Warehouse,
  FileBarChart,
  Settings,
  UserCheck,
  Landmark,
  Shield,
} from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'Principal',
      allowedRoles: ['ADMIN', 'VENDEDOR', 'ALMACENISTA', 'RH'],
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/reportes', label: 'Reportes Avanzados', icon: FileBarChart, roles: ['ADMIN'] },
        { to: '/admin', label: 'Administración Global', icon: Settings, roles: ['ADMIN'] },
      ],
    },
    {
      label: 'Ventas',
      allowedRoles: ['ADMIN', 'VENDEDOR'],
      items: [
        { to: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
        { to: '/consignaciones', label: 'Consignaciones', icon: PackageSearch, roles: ['ADMIN'] },
        { to: '/liquidacion', label: 'Liquidación', icon: Calculator, roles: ['ADMIN'] },
        { to: '/facturacion', label: 'Facturación CFDI', icon: FileText, roles: ['ADMIN'] },
      ],
    },
    {
      label: 'Finanzas',
      allowedRoles: ['ADMIN'],
      items: [
        { to: '/cxc', label: 'Cuentas por Cobrar', icon: CreditCard },
        { to: '/cxp', label: 'Cuentas por Pagar', icon: ShoppingBag },
        { to: '/tesoreria', label: 'Tesorería', icon: Landmark },
      ],
    },
    {
      label: 'Inventario',
      allowedRoles: ['ADMIN', 'ALMACENISTA', 'VENDEDOR'],
      items: [
        { to: '/almacenes', label: 'Gestión Almacenes', icon: Warehouse, roles: ['ADMIN', 'ALMACENISTA'] },
        { to: '/kardex', label: 'Logística Kardex', icon: ArrowLeftRight, roles: ['ADMIN', 'ALMACENISTA', 'VENDEDOR'] },
        { to: '/productos', label: 'Catálogo Productos', icon: PackageSearch, roles: ['ADMIN', 'ALMACENISTA', 'VENDEDOR'] },
      ],
    },
    {
      label: 'RH & CRM',
      allowedRoles: ['ADMIN', 'VENDEDOR', 'RH', 'ALMACENISTA'],
      items: [
        { to: '/hr', label: 'Recursos Humanos', icon: UserCheck },
        { to: '/vendedores', label: 'Directorio Vendedores', icon: Users, roles: ['ADMIN', 'RH'] },
        { to: '/clientes', label: 'Directorio Clientes', icon: Users, roles: ['ADMIN', 'VENDEDOR'] },
        { to: '/proveedores', label: 'Directorio Proveedores', icon: Users, roles: ['ADMIN'] },
      ],
    },
    {
      label: 'Administración',
      allowedRoles: ['ADMIN'],
      items: [
        { to: '/superadmin', label: 'Panel Super Admin', icon: Shield, roles: ['ADMIN'] },
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-700/40 bg-hc-surface-dark overflow-y-auto">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-gray-700/40 px-5 py-5 sticky top-0 bg-hc-surface-dark z-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-hc-cobalt/20">
          <Hexagon className="h-5 w-5 text-hc-cobalt-light" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-gray-100">HEXA CORE</h1>
          <p className="text-xxs font-medium text-gray-500">ERP v2.0</p>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups
          .filter(group => !group.allowedRoles || (user && group.allowedRoles.includes(user.role)))
          .map((group) => {
            const groupItems = group.items.filter(item => !item.roles || (user && item.roles.includes(user.role)));

            if (groupItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="mb-2 px-2 text-xxs font-semibold uppercase tracking-widest text-gray-500">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {groupItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-hc-cobalt/15 text-hc-cobalt-light shadow-sm'
                            : 'text-gray-400 hover:bg-hc-surface-light/50 hover:text-gray-200'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`h-[18px] w-[18px] flex-shrink-0 ${
                              isActive ? 'text-hc-cobalt-light' : 'text-gray-500 group-hover:text-gray-300'
                            }`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className="truncate">{label}</span>
                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-hc-cobalt-light" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
        })}
      </nav>

      {/* ── User Footer ──────────────────────────────────────────── */}
      <div className="border-t border-gray-700/40 px-4 py-4 sticky bottom-0 bg-hc-surface-dark">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-hc-cobalt/20 text-xs font-bold text-hc-cobalt-light uppercase">
            {user?.name?.substring(0, 2) || 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-200">{user?.name || 'Usuario'}</p>
            <p className="truncate text-xxs text-gray-500">{user?.role || 'Guest'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-hc-surface-light hover:text-gray-300"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
