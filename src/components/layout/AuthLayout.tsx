import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated } = useAuth();

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-50 dark:bg-backgroundDark">
      <div className="w-full  space-y-8 bg-white dark:bg-backgroundDark rounded-lg shadow-md">
        
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
