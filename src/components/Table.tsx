import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`overflow-hidden rounded-2xl border border-gray-100/80 dark:border-gray-800/80 bg-white/70 dark:bg-secondary-900/80 backdrop-blur ${className}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
        {children}
      </table>
    </div>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-gray-50/80 dark:bg-secondary-900/80">
    {children}
  </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{children}</tbody>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <tr className={`hover:bg-gray-50/80 dark:hover:bg-secondary-900/60 transition-colors ${className}`}>
    {children}
  </tr>
);

export const TableHeadCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <th
    scope="col"
    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 ${className}`}
  >
    {children}
  </th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <td className={`px-4 py-3 align-middle text-sm text-gray-700 dark:text-gray-200 ${className}`}>
    {children}
  </td>
);
