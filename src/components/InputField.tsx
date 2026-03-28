import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helperText,
  icon,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-gray-500">{icon}</div>}

        <input
          className={`w-full px-4 py-2 border rounded-lg transition-colors outline-none shadow-sm ${
            icon ? 'pl-10' : 'pl-4'
          } ${
            error
              ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
              : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'
          } dark:bg-gray-800 dark:border-gray-700 dark:text-white ${className}`}
          {...props}
        />
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <textarea
        className={`w-full px-4 py-2 border rounded-lg transition-colors outline-none shadow-sm ${
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
            : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'
        } dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none ${className}`}
        {...props}
      />

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        className={`w-full px-4 py-2 border rounded-lg transition-colors outline-none shadow-sm appearance-none ${
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
            : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'
        } dark:bg-gray-800 dark:border-gray-700 dark:text-white ${className}`}
        {...props}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>}
    </div>
  );
};
