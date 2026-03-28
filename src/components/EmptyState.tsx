import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50/80 via-white/80 to-emerald-50/60 dark:from-secondary-900/80 dark:via-secondary-950/80 dark:to-emerald-900/20 px-6 py-12 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 dark:bg-secondary-900/80 shadow-soft-lg">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 opacity-80" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-500/20" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
