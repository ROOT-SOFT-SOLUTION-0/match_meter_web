import React from 'react';

interface LoadingProps {
  fullscreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export const Loading: React.FC<LoadingProps> = ({
  fullscreen = false,
  size = 'md',
  message = 'Loading...',
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        className={`animate-spin ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && <p className="text-gray-600 dark:text-gray-400">{message}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8">{spinner}</div>
      </div>
    );
  }

  return spinner;
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);
