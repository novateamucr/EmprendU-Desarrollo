import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Call the logout function from auth context
    logout();
    
    // Clear all cookies by setting them to expire in the past
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Clear sessionStorage
    sessionStorage.clear();

    // Redirect to login page after a short delay
    const timer = setTimeout(() => {
      navigate('/login');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, logout]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-700">Cerrando sesión...</p>
      </div>
    </div>
  );
}
