import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useDynamicTheme } from '@/lib/useDynamicTheme';
import { SupportButton } from '@/components/SupportButton';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, LogOut } from 'lucide-react';
import ReadOnlyBanner from './ReadOnlyBanner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  useDynamicTheme();
  const { isImpersonating, revertImpersonation, user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-hc-bg relative">
      {/* Impersonation Watermark */}
      {isImpersonating && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 z-[60] shadow-[0_0_15px_rgba(220,38,38,0.8)] pointer-events-none" />
      )}
      {isImpersonating && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl animate-pulse">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-bold tracking-wider text-sm uppercase">
            MODO IMPERSONACIÓN ACTIVO: {user?.tenantId}
          </span>
          <button 
            onClick={revertImpersonation}
            className="ml-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            REVERTIR
          </button>
        </div>
      )}

      {/* Sidebar fijo */}
      <Sidebar />

      {/* Área de contenido principal — scrollable */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <ReadOnlyBanner />
        <div className="absolute top-6 right-6 z-40">
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-[1600px] p-6 pt-16 pb-24">
          {children}
        </div>
      </main>
      <SupportButton />
    </div>
  );
}
