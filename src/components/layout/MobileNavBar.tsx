import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { Home, LayoutDashboard, Trophy, Users, UserCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
  roles: Array<'user' | 'admin' | 'super_admin'>;
}

const items: NavItem[] = [
  {
    label: 'Feed',
    path: '/feed',
    icon: <Home className="h-5 w-5" />,
    roles: ['user'],
  },
  {
    label: 'Dashboard',
    path: '/player',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['user'],
  },
  {
    label: 'Tournaments',
    path: '/tournaments',
    icon: <Trophy className="h-5 w-5" />,
    roles: ['user', 'admin', 'super_admin'],
  },
  {
    label: 'My Teams',
    path: '/my-teams',
    icon: <Users className="h-5 w-5" />,
    roles: ['user', 'admin', 'super_admin'],
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: <UserCircle className="h-5 w-5" />,
    roles: ['user', 'admin', 'super_admin'],
  },
];

export const MobileNavBar = ({ hidden = false }: { hidden?: boolean }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || hidden) return null;

  const visible = items.filter((i) => i.roles.includes(user.role));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200/80 dark:border-gray-800/90 bg-white/95 dark:bg-secondary-950/95 backdrop-blur-md md:hidden">
      <div className="flex justify-around items-center py-2">
        {visible.map((item) => {
          const isActive =
            location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
            >
              <span
                className={[
                  'inline-flex h-8 w-8 items-center justify-center rounded-full',
                  isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                    : 'text-gray-500 dark:text-gray-400',
                ].join(' ')}
              >
                {item.icon}
              </span>
              <span
                className={
                  isActive
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-gray-500 dark:text-gray-400'
                }
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
