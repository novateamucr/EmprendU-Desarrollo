import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user, token } = useAuth();
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

  // If not authenticated or missing token/user, redirect to login
  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is admin (role 3)
  const userRole = user?.role ? (typeof user.role === 'string' ? parseInt(user.role) : user.role) : null;
  
  if (userRole !== 3) {
    console.log(`User with role ${userRole} (${typeof userRole}) attempted to access admin route`);
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  // User is authenticated and is an admin
  return <>{children}</>;
};
