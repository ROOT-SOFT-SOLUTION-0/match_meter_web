import React from 'react';
import { useUIStore } from '../store';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const toastColorClasses: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-white',
};

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg flex items-start gap-3 pointer-events-auto animate-slide-in-up ${
            toastColorClasses[toast.type]
          }`}
        >
          <span className="text-lg font-bold">{toastIcons[toast.type]}</span>
          <div className="flex-1">
            <p className="font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-lg hover:opacity-75 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
