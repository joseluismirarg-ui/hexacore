import { useEffect } from 'react';
import { useTenantConfig } from './hooks';

export function useDynamicTheme() {
  const { data: tenant } = useTenantConfig();

  useEffect(() => {
    if (!tenant?.industry) return;

    const root = document.documentElement;

    switch (tenant.industry) {
      case 'CONSTRUCTION':
        // Tema oscuro industrial con acentos naranjas
        root.style.setProperty('--color-primary', '#F97316'); // Orange 500
        root.style.setProperty('--color-surface', '#1F2937'); // Gray 800
        root.style.setProperty('--color-bg', '#111827'); // Gray 900
        break;
      case 'RETAIL':
        // Tema brillante y limpio
        root.style.setProperty('--color-primary', '#3B82F6'); // Blue 500
        root.style.setProperty('--color-surface', '#FFFFFF'); 
        root.style.setProperty('--color-bg', '#F3F4F6'); // Gray 100
        break;
      case 'OIL':
        // Tema petróleo/oscuro profundo
        root.style.setProperty('--color-primary', '#EAB308'); // Yellow 500
        root.style.setProperty('--color-surface', '#0F172A'); // Slate 900
        root.style.setProperty('--color-bg', '#020617'); // Slate 950
        break;
      default:
        // GENERAL - HEXA CORE Original
        root.style.setProperty('--color-primary', '#004BFF'); // Cobalt
        root.style.setProperty('--color-surface', '#1E293B'); // Slate 800
        root.style.setProperty('--color-bg', '#0F172A'); // Slate 900
        break;
    }
  }, [tenant?.industry]);
}
