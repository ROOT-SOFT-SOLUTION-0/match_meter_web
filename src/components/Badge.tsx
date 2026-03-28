import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-transparent',
  success:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-100/80 dark:border-emerald-500/40',
  warning:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-100/80 dark:border-amber-500/40',
  danger:
    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-100/80 dark:border-rose-500/40',
  info:
    'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-100/80 dark:border-sky-500/40',
  outline:
    'bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
