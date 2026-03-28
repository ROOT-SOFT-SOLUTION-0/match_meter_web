import React, { useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks';
import { useUIStore } from '../../store';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const theme = useUIStore((state) => state.theme);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <svg className="w-12 h-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const mainOffset = user ? (isSidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[280px]') : '';
  const mobileOffset = user && isSidebarOpen ? 'pl-0' : '';

  return (
    <div className="flex flex-col min-h-screen bg-secondary-50 dark:bg-secondary-950 transition-colors duration-200">
      <Header />
      {user && <Sidebar />}

      <main className={["flex-1 transition-all duration-300", mainOffset, mobileOffset].join(' ')}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
