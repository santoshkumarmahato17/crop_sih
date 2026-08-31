import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Initializing agricultural telemetry and spatial grids...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-400 font-medium animate-pulse">{message}</p>
    </div>
  );
};
