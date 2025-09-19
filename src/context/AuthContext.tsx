import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface User {
  id: number;
  name?: string;
  email: string;
  role: number;
  phone?: string;
  province?: string;
  canton?: string;
  district?: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
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
  loading: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Debug log when component mounts
  useEffect(() => {
    console.log('AuthProvider mounted');
    return () => {
      console.log('AuthProvider unmounted');
    };
  }, []);

  // Function to set auth data in localStorage with expiration
  const setAuthData = useCallback((token: string, userData: User) => {
    try {
      console.log('Setting auth data in localStorage');
      const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const expirationTime = new Date().getTime() + expiresIn;
      
      const authData = {
        token,
        user: userData,
        expiresAt: expirationTime
      };
      
      localStorage.setItem('auth', JSON.stringify(authData));
      console.log('Auth data stored in localStorage');
      return userData;
    } catch (error) {
      console.error('Error setting auth data:', error);
      throw error;
    }
  }, []);

  // Function to get auth data from localStorage
  const getAuthData = useCallback(() => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) {
        console.log('No auth data found in localStorage');
        return null;
      }
      
      const parsed = JSON.parse(authData);
      const now = new Date().getTime();
      
      // Check if the session has expired
      if (now > parsed.expiresAt) {
        console.log('Session expired');
        localStorage.removeItem('auth');
        return null;
      }
      
      console.log('Retrieved auth data from localStorage');
      return parsed;
    } catch (error) {
      console.error('Error getting auth data:', error);
      localStorage.removeItem('auth');
      return null;
    }
  }, []);

  // Function to fetch user data using the token
  const fetchUserData = useCallback(async (token: string) => {
    try {
      setLoading(true);
      console.log('Fetching user data with token:', token);
      const response = await fetch('http://emprendu-backend.test/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data received:', userData);
        
        // Ensure we have all required user fields
        const completeUserData = {
          id: userData.id,
          name: userData.name || '',
          username: userData.username || '',
          email: userData.email || '',
          role: userData.role,
          phone: userData.phone || '',
          province: userData.province || '',
          canton: userData.canton || '',
          district: userData.district || '',
          address: userData.address || '',
          avatar_url: userData.avatar_url || '',
          created_at: userData.created_at || new Date().toISOString(),
          updated_at: userData.updated_at || new Date().toISOString(),
        };
        
        // Store auth data with expiration
        setAuthData(token, completeUserData);
        setToken(token);
        setUser(completeUserData);
        console.log('User data set in context and localStorage');
        return completeUserData;
      } else {
        // If the token is invalid, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        throw new Error('Invalid or expired token');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for existing auth data on initial load
  useEffect(() => {
    console.log('AuthProvider: Checking for existing session...');
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const authData = getAuthData();
        console.log('Auth data from storage:', authData);
        
        if (authData?.token && authData?.user) {
          console.log('AuthProvider: Found stored session');
          const { token, user } = authData;
          
          // Set the stored user immediately for better UX
          if (isMounted) {
            setToken(token);
            setUser(user);
          }
          
          // Then validate the token with the server
          console.log('AuthProvider: Validating token with server...');
          try {
            await fetchUserData(token);
            console.log('AuthProvider: Token validation successful');
          } catch (error) {
            console.error('AuthProvider: Token validation failed', error);
            // Clear invalid session
            localStorage.removeItem('auth');
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          }
        } else {
          console.log('AuthProvider: No valid session found');
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        // Clear invalid session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (isMounted) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [fetchUserData]);

  const login = useCallback((response: LoginResponse) => {
    try {
      console.log('AuthProvider: Login called with response:', response);
      const { token, user } = response;
      
      if (!token || !user) {
        throw new Error('Invalid login response: missing token or user data');
      }
      
      console.log('AuthProvider: Storing session data...');
      // Store auth data with expiration
      setAuthData(token, user);
      
      // Update state
      console.log('AuthProvider: Updating auth state...');
      setToken(token);
      setUser(user);
      
      console.log('AuthProvider: Login successful');
      return true;
    } catch (error) {
      console.error('AuthProvider: Error during login:', error);
      // Clear any partial auth data
      localStorage.removeItem('auth');
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setAuthData]);

  const logout = useCallback(() => {
    console.log('Logging out...');
    
    // Clear all auth data
    localStorage.removeItem('auth');
    
    // Clear state
    setToken(null);
    setUser(null);
    setLoading(false);
    
    console.log('Auth data cleared, redirecting to login...');
    // Redirect to login
    window.location.href = '/login';
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: !!(token && user), // Only authenticated if both token and user exist
    isAdmin: user?.role === 1,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
