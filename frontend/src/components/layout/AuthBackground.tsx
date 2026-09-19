import React from 'react';

export const AuthBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center py-8 px-4 bg-white dark:bg-surface-darkBg">
      <div className="relative z-10 w-full max-w-lg">
        {children}
      </div>
    </div>
  );
};
