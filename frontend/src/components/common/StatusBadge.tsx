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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'degraded':
      case 'configured':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'unhealthy':
      case 'unavailable':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const dotColor = () => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return 'bg-emerald-400';
      case 'degraded':
      case 'configured':
        return 'bg-amber-400';
      case 'unhealthy':
      case 'unavailable':
        return 'bg-rose-400';
      default:
        return 'bg-slate-400';
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
