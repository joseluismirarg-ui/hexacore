import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useDynamicTheme } from '@/lib/useDynamicTheme';
import { SupportButton } from '@/components/SupportButton';
import { NotificationBell } from '@/components/NotificationBell';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  useDynamicTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-hc-bg">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Área de contenido principal — scrollable */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-6 right-6 z-40">
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-[1600px] p-6 pt-16">
          {children}
        </div>
      </main>
      <SupportButton />
    </div>
  );
}
