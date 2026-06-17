import React from 'react';

type BadgeVariant = 'cobalt' | 'emerald' | 'coral' | 'amber' | 'gray';
type BadgeSize = 'sm' | 'md';

const variantStyles: Record<BadgeVariant, string> = {
  cobalt: 'bg-hc-cobalt/15 text-hc-cobalt-light border-hc-cobalt/30',
  emerald: 'bg-hc-emerald/15 text-hc-emerald-light border-hc-emerald/30',
  coral: 'bg-hc-coral/15 text-hc-coral-light border-hc-coral/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  gray: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xxs px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export function Badge({
  children,
  variant = 'gray',
  size = 'sm',
  dot = false,
  className = '',
  onClick,
  active = false,
}: BadgeProps) {
  const isClickable = !!onClick;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isClickable ? 'cursor-pointer transition-all duration-150 hover:brightness-125 active:scale-95' : ''}
        ${active ? 'ring-1 ring-offset-1 ring-offset-hc-bg ring-current' : ''}
        ${className}
      `}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' && onClick) onClick(); }}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === 'emerald'
              ? 'bg-hc-emerald'
              : variant === 'coral'
              ? 'bg-hc-coral'
              : variant === 'cobalt'
              ? 'bg-hc-cobalt-light'
              : variant === 'amber'
              ? 'bg-amber-400'
              : 'bg-gray-400'
          }`}
        />
      )}
      {children}
    </span>
  );
}
