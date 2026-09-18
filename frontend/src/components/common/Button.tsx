import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-agri-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 text-white shadow-lg shadow-agri-500/20 hover:shadow-agri-500/30',
    secondary:
      'bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/40 dark:hover:bg-agri-800/60 text-agri-800 dark:text-agri-100 border border-agri-200/50 dark:border-agri-700/30',
    outline:
      'bg-transparent hover:bg-agri-500/10 text-agri-600 dark:text-agri-400 border border-agri-500/30 hover:border-agri-500/50',
    ghost:
      'bg-transparent hover:bg-agri-50 dark:hover:bg-agri-800/40 text-agri-600 dark:text-agri-300 hover:text-agri-800 dark:hover:text-white',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-6 py-3 text-sm sm:text-base gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
