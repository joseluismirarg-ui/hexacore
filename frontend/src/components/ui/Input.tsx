import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  id,
  className = '',
  ...rest
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={inputId}
        className="block text-xs font-medium uppercase tracking-wider text-gray-400"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-lg border bg-hc-surface-dark px-3 py-2 text-sm text-gray-100
            placeholder-gray-500 transition-all duration-150
            focus:border-hc-cobalt focus:ring-1 focus:ring-hc-cobalt focus:outline-none
            ${icon ? 'pl-9' : ''}
            ${error
              ? 'border-hc-coral focus:border-hc-coral focus:ring-hc-coral'
              : 'border-gray-600 hover:border-gray-500'
            }
          `}
          {...rest}
        />
      </div>
      {error && (
        <p className="text-xs text-hc-coral">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
