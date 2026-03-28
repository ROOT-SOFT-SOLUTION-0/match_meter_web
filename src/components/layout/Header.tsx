import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useUIStore } from '../../store';
import { useAuth } from '../../hooks';
import imageService from '../../services/image.service';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  // Convert profile image for display
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.profileImage) {
      setAvatarUrl(imageService.ensureDataUrl(user.profileImage));
    } else {
      setAvatarUrl(null);
    }
  }, [user?.profileImage]);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const toggleSidebarCollapsed = useUIStore((state) => state.toggleSidebarCollapsed);

  const handlePrimarySidebarToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebarCollapsed();
      return;
    }
    toggleSidebar();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 dark:border-gray-800/80 bg-white/80 dark:bg-secondary-950/90 backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {user && (
            <button
              onClick={handlePrimarySidebarToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/60 dark:bg-secondary-900/80 hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            </button>
          )}

          {user && (
            <button
              onClick={toggleSidebarCollapsed}
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/60 dark:bg-secondary-900/80 hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {isSidebarCollapsed ? '<' : '>'}
              </span>
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-soft">
              M
            </div>
            <span className="hidden sm:inline-flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                MatchMeter
              </span>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                Tournament Control Center
              </span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search tournaments, teams, admins..."
              className="w-full rounded-xl border border-gray-200/80 dark:border-gray-700 bg-gray-50/80 dark:bg-secondary-900/80 px-9 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-400/40 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-secondary-900/80 hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-gray-600 dark:text-gray-200" />
            </button>
          )}

          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-primary-500 transition-colors"
            >
              Sign in
            </Link>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-secondary-900 border border-gray-200/80 dark:border-gray-700 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary-400/40 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-secondary-950 transition-all">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">
                      {(user.displayName || user.email || 'MM')
                        .split(' ')
                        .map((part: string) => part[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
              </Link>

              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[160px]">
                  {user.displayName}
                </span>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate max-w-[160px]">
                  {user.email}
                </span>
              </div>

              <button
                onClick={() => signOut()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-secondary-900/80 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:border-rose-200 dark:hover:border-rose-500/60 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-200" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
