import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  padding = 'md',
  hoverEffect = false,
}) => {
  const variantStyles = {
    glass:
      'bg-white/90 dark:bg-surface-darkCard/80 border border-agri-200/50 dark:border-agri-700/25 backdrop-blur-xl shadow-card dark:shadow-card-dark text-agri-900 dark:text-agri-50',
    solid:
      'bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-card dark:shadow-card-dark text-agri-900 dark:text-agri-50',
    gradient:
      'bg-gradient-to-br from-white via-white/95 to-agri-50/80 dark:from-surface-darkCard dark:via-surface-darkCard/90 dark:to-agri-900/40 border border-agri-500/15 dark:border-agri-500/20 shadow-card dark:shadow-card-dark text-agri-900 dark:text-agri-50',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hoverEffect
    ? 'transition-all duration-300 hover:border-agri-500/40 dark:hover:border-agri-500/30 hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-3xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};
