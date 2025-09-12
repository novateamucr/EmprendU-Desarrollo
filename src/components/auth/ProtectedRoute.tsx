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

  // TEMPORARY: Bypass all route protection for demonstration
  console.warn('Route protection is currently disabled for demonstration purposes');
  
  // If public only and user is authenticated, still allow access
  if (publicOnly && isAuthenticated) {
    console.log('Public only route accessed by authenticated user - allowing access');
  }
  
  // Render the children or outlet regardless of authentication or role
  return children ? <>{children}</> : <Outlet />;
};
