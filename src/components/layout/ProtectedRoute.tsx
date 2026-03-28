import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { Loading } from '../Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
  checkProfileCompletion?: boolean;
}

const rolePriority: Record<'user' | 'admin' | 'super_admin', number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

const hasRequiredRole = (
  currentRole: 'user' | 'admin' | 'super_admin',
  requiredRole: 'user' | 'admin' | 'super_admin'
): boolean => rolePriority[currentRole] >= rolePriority[requiredRole];

const getHomeRouteByRole = (role: 'user' | 'admin' | 'super_admin'): string => {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/admin';
  return '/player';
};

// Keep profile completion rules minimal so users aren't blocked
// from accessing the app after filling basic information.
const isProfileComplete = (user: any): boolean => {
  return !!(user.displayName && user.phone);
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  checkProfileCompletion = true
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullscreen message="Verifying authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if profile is complete before allowing access to other features
  if (checkProfileCompletion && !isProfileComplete(user)) {
    return <Navigate to="/profile" replace state={{ from: 'redirect_incomplete' }} />;
  }

  if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
    return <Navigate to={getHomeRouteByRole(user.role)} replace />;
  }

  return <>{children}</>;
};
