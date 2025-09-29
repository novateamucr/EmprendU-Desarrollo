import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If user is on the root path and authenticated, redirect to appropriate dashboard
  if (isAuthenticated && location.pathname === '/') {
    // Only admins (role 3) go to /gestor-usuarios, all others go to /home
    return <Navigate to={user?.role === 3 ? '/gestor-usuarios' : '/home'} replace />;
  }

  // If user is on the landing page and authenticated, redirect to appropriate dashboard
  if (isAuthenticated && location.pathname === '/landing') {
    return <Navigate to={user?.role === 3 ? '/gestor-usuarios' : '/home'} replace />;
  }

  // For all other cases, render the landing page
  return <Navigate to="/landing" replace />;
}
