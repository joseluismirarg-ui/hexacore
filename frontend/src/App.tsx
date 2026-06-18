import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { RutasConsignacion } from '@/pages/RutasConsignacion';
import { Liquidacion } from '@/pages/Liquidacion';
import { CatalogoProductos } from '@/pages/CatalogoProductos';
import { DirectorioClientes } from '@/pages/DirectorioClientes';
import { DirectorioVendedores } from '@/pages/DirectorioVendedores';
import { PuntoDeVenta } from '@/pages/PuntoDeVenta';
import { LogisticaKardex } from '@/pages/LogisticaKardex';
import { CuentasPorCobrar } from '@/pages/CuentasPorCobrar';
import { CuentasPorPagar } from '@/pages/CuentasPorPagar';
import { FacturacionCFDI } from '@/pages/FacturacionCFDI';
import GestionAlmacenes from '@/pages/GestionAlmacenes';
import DirectorioProveedores from '@/pages/DirectorioProveedores';
import ModuloReportes from '@/pages/ModuloReportes';
import RecursosHumanos from '@/pages/RecursosHumanos';
import AdministracionGlobal from '@/pages/AdministracionGlobal';
import SuperAdminPanel from '@/pages/SuperAdminPanel';
import Tesoreria from '@/pages/Tesoreria';
import Manufactura from '@/pages/Manufactura';
import { ListasDePrecios } from '@/pages/ListasDePrecios';
import OnboardingWizard from '@/pages/OnboardingWizard';
import LandlordDashboard from '@/pages/LandlordDashboard';
import PasarelaSuscripcion from '@/pages/PasarelaSuscripcion';
import AdminSupport from '@/pages/AdminSupport';

// Wrapper para layout protegido
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/suscripcion" element={<PasarelaSuscripcion />} />

          {/* Rutas Privadas del ERP */}
          <Route element={<ProtectedLayout />}>
            {/* ── Core ───────────────────────── */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reportes" element={<ModuloReportes />} />
            <Route path="/admin" element={<AdministracionGlobal />} />

            {/* ── Ventas ─────────────────────── */}
            <Route path="/pos" element={<PuntoDeVenta />} />
            <Route path="/consignaciones" element={<RutasConsignacion />} />
            <Route path="/liquidacion" element={<Liquidacion />} />
            <Route path="/facturacion" element={<FacturacionCFDI />} />

            {/* ── Finanzas ───────────────────── */}
            <Route path="/cxc" element={<CuentasPorCobrar />} />
            <Route path="/cxp" element={<CuentasPorPagar />} />
            <Route path="/tesoreria" element={<Tesoreria />} />

            {/* ── Inventario & Manufactura ─────────────────── */}
            <Route path="/kardex" element={<LogisticaKardex />} />
            <Route path="/productos" element={<CatalogoProductos />} />
            <Route path="/almacenes" element={<GestionAlmacenes />} />
            <Route path="/manufactura" element={<Manufactura />} />

            {/* ── RRHH & CRM ─────────────────── */}
            <Route path="/clientes" element={<DirectorioClientes />} />
            <Route path="/clientes/precios" element={<ListasDePrecios />} />
            <Route path="/vendedores" element={<DirectorioVendedores />} />
            <Route path="/proveedores" element={<DirectorioProveedores />} />
            <Route path="/hr" element={<RecursosHumanos />} />

            {/* ── Administración ───────────────── */}
            <Route path="/superadmin" element={<SuperAdminPanel />} />
            <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
            <Route path="/soporte-admin" element={<AdminSupport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
