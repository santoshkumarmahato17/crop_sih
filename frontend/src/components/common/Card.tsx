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
      'bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl text-slate-100',
    solid:
      'bg-slate-900 border border-slate-800 shadow-md text-slate-100',
    gradient:
      'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/20 shadow-xl text-slate-100',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hoverEffect
    ? 'transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-3xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};
