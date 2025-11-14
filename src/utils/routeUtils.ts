import { NavigateFunction } from 'react-router-dom';

/**
 * Returns the dashboard path based on user role
 * @param role - User role (3: Admin, 2: Entrepreneur, 1: Client)
 * @returns Path to redirect the user to
 */
export const getDashboardPath = (role: number): string => {
  console.log(`Getting dashboard path for role: ${role}`);
  
  switch (role) {
    case 3: // Admin (role 3)
      return '/admin/dashboard';
    case 2: // Entrepreneur (role 2)
      return '/home';
    case 1: // Client (role 1)
      return '/home';
    default:
      console.warn(`Unknown role ${role}, redirecting to login`);
      return '/login';
  }
};

type NavigationHandler = NavigateFunction | ((path: string) => void);

const redirectByRole = (role: number, navigate: NavigationHandler) => {
  const path = getDashboardPath(role);
  console.log(`Redirecting to ${path} for role ${role}`);
  
  if (typeof navigate === 'function') {
    // Check if it's a React Router navigate function
    if (navigate.length >= 2) {
      (navigate as NavigateFunction)(path, { replace: true });
    } else {
      // Handle window.history or similar
      (navigate as (path: string) => void)(path);
    }
  }
};

export { redirectByRole };

export default {
  getDashboardPath,
  redirectByRole
};
