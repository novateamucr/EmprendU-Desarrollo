import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

export interface User {
  id: number;
  name?: string;
  email: string;
  role: number; // 3: Admin, 2: Entrepreneur, 1: Regular User
  phone?: string;
  province?: string;
  canton?: string;
  district?: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role_relation?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  interests?: Array<{
    id: number;
    name: string;
    description?: string;
  }> | [];
  entrepreneurships?: Array<{
    id: number;
    name: string;
    description?: string;
  }> | [];
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEntrepreneur: boolean;
  isRegularUser: boolean;
  loading: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  hasRole: (role: number | number[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = useCallback((response: LoginResponse) => {
    try {
      const { token, user } = response;
      
      // Set state
      setToken(token);
      setUser(user);
      setLoading(false);
      
      // Save to localStorage
      const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
      const authData = {
        token,
        user,
        expiresAt: new Date().getTime() + expiresIn
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setToken(null);
      setUser(null);
      setLoading(false);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setLoading(false);
    localStorage.removeItem('auth');
  }, []);

  // Initial auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authData = localStorage.getItem('auth');
      if (!authData) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(authData);
        const now = new Date().getTime();

        if (parsed?.expiresAt && now > parsed.expiresAt) {
          localStorage.removeItem('auth');
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (parsed?.token && parsed?.user) {
          // Always update with the latest token and user from localStorage
          setToken(parsed.token);
          setUser(parsed.user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Empty dependency array since we only want to run this once on mount

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 3,
    isEntrepreneur: user?.role === 2,
    isRegularUser: user?.role === 1,
    login,
    logout,
    hasRole: (role: number | number[]) => {
      if (!user) return false;
      return Array.isArray(role) 
        ? role.includes(user.role)
        : user.role === role;
    },
  }), [token, user, loading, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
