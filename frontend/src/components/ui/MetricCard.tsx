import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardMetric } from '@/types/models';

const colorMap = {
  cobalt: {
    border: 'border-hc-cobalt/40',
    bg: 'bg-hc-cobalt/10',
    icon: 'text-hc-cobalt-light',
    glow: 'shadow-hc-cobalt/5',
  },
  emerald: {
    border: 'border-hc-emerald/40',
    bg: 'bg-hc-emerald/10',
    icon: 'text-hc-emerald-light',
    glow: 'shadow-hc-emerald/5',
  },
  coral: {
    border: 'border-hc-coral/40',
    bg: 'bg-hc-coral/10',
    icon: 'text-hc-coral-light',
    glow: 'shadow-hc-coral/5',
  },
} as const;

interface MetricCardProps extends DashboardMetric {
  icon: LucideIcon;
}

export function MetricCard({
  title,
  value,
  subtitle,
  delta,
  deltaType = 'neutral',
  color,
  icon: Icon,
}: MetricCardProps) {
  const scheme = colorMap[color as keyof typeof colorMap] || {
    border: 'border-gray-700/40',
    bg: 'bg-gray-800/50',
    icon: 'text-gray-400',
    glow: 'shadow-none',
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border ${scheme?.border || 'border-gray-700/40'}
        bg-hc-surface p-5 shadow-lg ${scheme?.glow || 'shadow-none'}
        transition-all duration-200 hover:shadow-xl hover:scale-[1.01]
      `}
    >
      {/* Gradient accent line */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] ${
          color === 'cobalt'
            ? 'bg-gradient-to-r from-transparent via-hc-cobalt to-transparent'
            : color === 'emerald'
            ? 'bg-gradient-to-r from-transparent via-hc-emerald to-transparent'
            : 'bg-gradient-to-r from-transparent via-hc-coral to-transparent'
        }`}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-gray-50">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className={`rounded-lg p-2.5 ${scheme?.bg || 'bg-gray-800/50'}`}>
          <Icon className={`h-5 w-5 ${scheme?.icon || 'text-gray-400'}`} strokeWidth={2} />
        </div>
      </div>

      {delta && (
        <div className="mt-3 flex items-center gap-1.5">
          {deltaType === 'positive' ? (
            <TrendingUp className="h-3.5 w-3.5 text-hc-emerald" />
          ) : deltaType === 'negative' ? (
            <TrendingDown className="h-3.5 w-3.5 text-hc-coral" />
          ) : null}
          <span
            className={`text-xs font-semibold ${
              deltaType === 'positive'
                ? 'text-hc-emerald'
                : deltaType === 'negative'
                ? 'text-hc-coral'
                : 'text-gray-400'
            }`}
          >
            {delta}
          </span>
          <span className="text-xs text-gray-500">vs. semana anterior</span>
        </div>
      )}
    </div>
  );
}
