import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';

type RoleBasedRouteProps = {
  children: ReactNode;
  allowedRoles: number[];
  redirectTo?: string;
};

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/home' 
}: RoleBasedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
