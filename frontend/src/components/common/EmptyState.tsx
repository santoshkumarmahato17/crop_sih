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
      className={`py-12 px-6 text-center rounded-3xl bg-white/80 dark:bg-surface-darkCard/60 border border-agri-200/50 dark:border-agri-700/25 space-y-4 max-w-md mx-auto shadow-card dark:shadow-card-dark ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-agri-50 dark:bg-agri-800/40 border border-agri-200/50 dark:border-agri-700/30 text-agri-500 dark:text-agri-400 mx-auto flex items-center justify-center shadow-sm">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-agri-800 dark:text-agri-100 font-display">{title}</h3>
        {description && (
          <p className="text-xs text-agri-500/70 dark:text-agri-400/60 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
