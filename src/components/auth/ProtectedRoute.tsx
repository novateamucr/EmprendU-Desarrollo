import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  /**
   * Array of role IDs that are allowed to access this route
   * If not provided, any authenticated user can access
   */
  allowedRoles?: number[];
  children?: React.ReactNode;
  /**
   * If true, only unauthenticated users can access this route (e.g., login, register)
   */
  publicOnly?: boolean;
  /**
   * Where to redirect if user doesn't have permission
   * @default '/'
   */
  redirectTo?: string;
}

/**
 * A component that protects routes based on authentication status and user roles.
 * 
 * @example
 * // Protect a route for any authenticated user
 * <Route element={<ProtectedRoute />}>
 *   <Route path="dashboard" element={<Dashboard />} />
 * </Route>
 * 
 * // Protect a route for admin users only
 * <Route element={<ProtectedRoute allowedRoles={[1]} redirectTo="/unauthorized" />}>
 *   <Route path="admin" element={<AdminPanel />} />
 * </Route>
 * 
 * // Public only route (e.g., login, register)
 * <Route element={<ProtectedRoute publicOnly />}>
 *   <Route path="login" element={<Login />} />
 * </Route>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  publicOnly = false,
  redirectTo = '/'
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Give some time for the auth state to be checked
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state while checking authentication
  if (loading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Handle public only routes (login, register, etc.)
  if (publicOnly) {
    if (isAuthenticated) {
      // If user is authenticated and tries to access public route, redirect to home
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
    // Allow access to public routes for unauthenticated users
    return children ? <>{children}</> : <Outlet />;
  }

  // Handle protected routes
  // If not authenticated and not a public route, redirect to login
  if (!isAuthenticated && !publicOnly) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If public only route and user is authenticated, redirect to home
  if (publicOnly && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role ? (typeof user.role === 'string' ? parseInt(user.role) : user.role) : null;
    
    if (!userRole) {
      return <Navigate to="/" replace />;
    }
    
    // If user is a client (role 1) trying to access non-client routes, redirect to home
    if (userRole === 1 && !allowedRoles.includes(1)) {
      return <Navigate to="/" replace />;
    }
    
    // For other roles, check if they have the required role
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // User is authenticated and has required role (if any)
  return children ? <>{children}</> : <Outlet />;
};
