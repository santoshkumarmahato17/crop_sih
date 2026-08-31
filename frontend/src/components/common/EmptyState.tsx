import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-6 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4 max-w-md mx-auto ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-200">{title}</h3>
        {description && (
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
