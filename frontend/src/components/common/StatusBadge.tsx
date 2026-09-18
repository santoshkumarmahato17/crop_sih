import React from 'react';

interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'operational' | 'configured' | 'unavailable' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyles = () => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25';
      case 'degraded':
      case 'configured':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'unhealthy':
      case 'unavailable':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
      default:
        return 'bg-agri-100 dark:bg-agri-800/40 text-agri-500 dark:text-agri-400 border-agri-200/50 dark:border-agri-700/30';
    }
  };

  const dotColor = () => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return 'bg-agri-500';
      case 'degraded':
      case 'configured':
        return 'bg-amber-500';
      case 'unhealthy':
      case 'unavailable':
        return 'bg-rose-500';
      default:
        return 'bg-agri-400';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getStyles()} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor()}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
