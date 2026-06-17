import React from 'react';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-hc-cobalt hover:bg-hc-cobalt-light text-white shadow-lg shadow-hc-cobalt/20 hover:shadow-hc-cobalt/30',
  secondary:
    'bg-hc-surface-light hover:bg-gray-700 text-gray-200 shadow-sm border border-gray-600',
  success:
    'bg-hc-emerald hover:bg-hc-emerald-light text-white shadow-lg shadow-hc-emerald/20',
  danger:
    'bg-hc-coral hover:bg-hc-coral-light text-white shadow-lg shadow-hc-coral/20',
  destructive:
    'bg-hc-coral hover:bg-hc-coral-light text-white shadow-lg shadow-hc-coral/20',
  ghost:
    'bg-transparent hover:bg-hc-surface-light text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
  xl: 'text-lg px-8 py-4 gap-3 font-bold',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-semibold
        transition-all duration-150 active:scale-[0.97]
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-hc-bg
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      ) : null}
      {children}
    </button>
  );
}
