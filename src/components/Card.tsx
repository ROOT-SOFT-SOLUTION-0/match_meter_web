import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      className={`bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/5 shadow-soft p-5 transition-all duration-200 ${
        hoverable
          ? 'hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, icon }) => (
  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100 dark:border-gray-800/50">
    {icon && <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-xl">{icon}</div>}
    <div>
      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">{title}</h3>
      {subtitle && <p className="text-[13px] text-gray-500 w-[max-content] mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/50 ${className}`}>{children}</div>
);
