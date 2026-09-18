import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div
      className={`inline-block animate-spin rounded-full border-agri-200 dark:border-agri-800 border-t-agri-500 dark:border-t-accent-lime ${sizeClasses} ${className}`}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Initializing agricultural telemetry and spatial grids...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-agri-500/70 dark:text-agri-400/60 font-medium animate-pulse">{message}</p>
    </div>
  );
};
