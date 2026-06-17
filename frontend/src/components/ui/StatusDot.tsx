import React from 'react';

type StatusType = 'active' | 'warning' | 'danger' | 'inactive';

const statusConfig: Record<StatusType, { dot: string; text: string }> = {
  active: { dot: 'bg-hc-emerald', text: 'text-hc-emerald' },
  warning: { dot: 'bg-amber-400', text: 'text-amber-400' },
  danger: { dot: 'bg-hc-coral', text: 'text-hc-coral' },
  inactive: { dot: 'bg-gray-500', text: 'text-gray-500' },
};

interface StatusDotProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusDot({
  status,
  label,
  size = 'sm',
  pulse = false,
}: StatusDotProps) {
  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${config.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${config.dot}`} />
      </span>
      {label && (
        <span className={`text-xs font-medium ${config.text}`}>{label}</span>
      )}
    </span>
  );
}
