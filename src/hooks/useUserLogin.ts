import { useState } from 'react';

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  message: string;
  user: {
    id: number;
    name?: string;
    username: string;
    email: string;
    role: number;
    phone?: string;
    province?: string;
    canton?: string;
    district?: string;
    address?: string;
    avatar_url?: string;
    roleRelation?: any;
    interests?: any[];
    created_at: string;
    updated_at: string;
  };
  token: string;
  token_type: string;
}

export function useUserLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (loginData: UserLoginData): Promise<UserLoginResponse | null> => {
    setLoading(true);
    setError(null);
    setIsAuthenticated(false);

    try {
      const apiUrl = "http://emprendu-backend.test";
      
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const result: UserLoginResponse = await response.json();
      
      // Store the token in localStorage or context as needed
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        setIsAuthenticated(true);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error during login';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
    isAuthenticated,
  };
}
