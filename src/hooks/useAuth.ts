import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie } from 'typescript-cookie';

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session on initial load
    const checkAuth = async () => {
      try {
        const token = getCookie('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Here you would typically validate the token with your backend
        // and fetch the user data. For now, we'll use a placeholder.
        // Replace this with your actual API call
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // If the token is invalid, clear it
          document.cookie = 'token=; Max-Age=0; path=/;';
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { token, user } = await response.json();
        document.cookie = `token=${token}; path=/;`;
        setUser(user);
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = () => {
    // Clear the token cookie
    document.cookie = 'token=; Max-Age=0; path=/;';
    setUser(null);
    navigate('/login');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
