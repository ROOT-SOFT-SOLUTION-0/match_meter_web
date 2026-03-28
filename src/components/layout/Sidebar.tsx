import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, Users, UserCircle, Settings2, Shield, Tv, Handshake, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks';
import { useUIStore } from '../../store';

type AppRole = 'user' | 'admin' | 'super_admin';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: AppRole[];
}

const navItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
    roles: ['admin', 'super_admin'],
  },
  {
    label: 'Tournaments',
    path: '/tournaments',
    icon: <Trophy className="h-4 w-4" aria-hidden="true" />,
    roles: ['user', 'admin', 'super_admin'],
  },
  {
    label: 'My Teams',
    path: '/my-teams',
    icon: <Users className="h-4 w-4" aria-hidden="true" />,
    roles: ['user', 'admin', 'super_admin'],
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: <UserCircle className="h-4 w-4" aria-hidden="true" />,
    roles: ['user', 'admin', 'super_admin'],
  },
  {
    label: 'Manage Tournaments',
    path: '/admin/tournaments',
    icon: <Settings2 className="h-4 w-4" aria-hidden="true" />,
    roles: ['admin', 'super_admin'],
  },
  {
    label: 'Create Tournament',
    path: '/create-tournament',
    icon: <Trophy className="h-4 w-4" aria-hidden="true" />,
    roles: ['admin', 'super_admin'],
  },
  {
    label: 'Super Admin',
    path: '/super-admin',
    icon: <Shield className="h-4 w-4" aria-hidden="true" />,
    roles: ['super_admin'],
  },
  {
    label: 'Admin Management',
    path: '/super-admin/admin-management',
    icon: <Users className="h-4 w-4" aria-hidden="true" />,
    roles: ['super_admin'],
  },
  {
    label: 'Stream Queue',
    path: '/super-admin/stream-queue',
    icon: <Tv className="h-4 w-4" aria-hidden="true" />,
    roles: ['super_admin'],
  },
  {
    label: 'Sponsors',
    path: '/super-admin/sponsors',
    icon: <Handshake className="h-4 w-4" aria-hidden="true" />,
    roles: ['super_admin'],
  },
  {
    label: 'Revenue & Payments',
    path: '/super-admin/revenue',
    icon: <Wallet className="h-4 w-4" aria-hidden="true" />,
    roles: ['super_admin'],
  },
];

const getTitle = (pathname: string): string => {
  if (pathname.startsWith('/super-admin')) return 'Super Admin';
  if (pathname.startsWith('/admin')) return 'Admin Tools';
  return 'Match Control';
};

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const toggleSidebarCollapsed = useUIStore((state) => state.toggleSidebarCollapsed);

  if (!user) {
    return null;
  }

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  // Ensure only the most specific matching route is marked active
  const activeItem = visibleItems
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => {
      if (location.pathname === item.path) return true;
      if (item.path !== '/' && location.pathname.startsWith(`${item.path}/`)) return true;
      return false;
    });

  return (
    <>
      {isSidebarOpen && (
        <button
          className="fixed inset-0 top-16 z-20 bg-black/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed left-0 top-16 bottom-0 z-30 border-r border-gray-200/80 dark:border-gray-800/90',
          'bg-white/90 dark:bg-secondary-950/95 backdrop-blur-xl',
          'transition-all duration-300 ease-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isSidebarCollapsed ? 'w-[84px]' : 'w-[280px]',
          'lg:translate-x-0',
        ].join(' ')}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100/80 dark:border-gray-800/80">
            <div className="flex items-start justify-between gap-3">
              <div className={isSidebarCollapsed ? 'hidden' : 'block'}>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 font-semibold mb-1">Workspace</p>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {getTitle(location.pathname)}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSidebarCollapsed}
                  className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? '»' : '«'}
                </button>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                  title="Close sidebar"
                  aria-label="Close sidebar"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {visibleItems.map((item) => {
              const isActive = activeItem?.path === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={[
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/15 to-primary-500/5 text-primary-700 dark:from-primary-500/20 dark:to-primary-500/5 dark:text-primary-300 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-secondary-900/70 hover:text-gray-900 dark:hover:text-gray-200',
                    isSidebarCollapsed ? 'justify-center px-2' : '',
                  ].join(' ')}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <span className="text-base leading-none opacity-80 group-hover:opacity-100 transition-opacity">
                    {item.icon}
                  </span>
                  {!isSidebarCollapsed && <span className="tracking-tight">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-gray-100/80 dark:border-gray-800/80 p-3">
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-secondary-900/80 p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize tracking-wide mt-0.5">{user.role.replace('_', ' ')}</p>
              {!isSidebarCollapsed && (
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Toggle panel for compact mode.</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
