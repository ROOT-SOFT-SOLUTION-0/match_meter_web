import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface Modal {
  id: string;
  title: string;
  content: React.ReactNode;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

interface UIState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Success/Error helpers
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;

  // Modals
  modals: Modal[];
  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Sidebar state
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',

  setTheme: () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    set({ theme: 'light' });
  },

  toggleTheme: () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    set({ theme: 'light' });
  },

  toasts: [],

  addToast: (message, type, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  showSuccess: (message) => {
    useUIStore.getState().addToast(message, 'success');
  },

  showError: (message) => {
    useUIStore.getState().addToast(message, 'error', 5000);
  },

  showInfo: (message) => {
    useUIStore.getState().addToast(message, 'info');
  },

  showWarning: (message) => {
    useUIStore.getState().addToast(message, 'warning');
  },

  modals: [],

  openModal: (modal) => {
    set((state) => ({
      modals: [...state.modals, modal],
    }));
  },

  closeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }));
  },

  closeAllModals: () => {
    set({ modals: [] });
  },

  isLoading: false,

  setIsLoading: (isLoading) => {
    set({ isLoading });
  },

  isSidebarOpen: window.innerWidth >= 768, // Open by default on desktop
  isSidebarCollapsed: false,

  setSidebarOpen: (isSidebarOpen) => {
    set({ isSidebarOpen });
  },

  setSidebarCollapsed: (isSidebarCollapsed) => {
    set({ isSidebarCollapsed });
  },

  toggleSidebar: () => {
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    }));
  },

  toggleSidebarCollapsed: () => {
    set((state) => ({
      isSidebarCollapsed: !state.isSidebarCollapsed,
    }));
  },
}));
