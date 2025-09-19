import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = "http://emprendu-backend.test/api";

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

  const login = useCallback(async (loginData: UserLoginData): Promise<{ token: string; user: any }> => {
    setLoading(true);
    setError(null);
    setIsAuthenticated(false);

    try {
      console.log('Creating login request to:', `${API_BASE_URL}/login`);
      
      // Create a clean axios instance for login
      const loginClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Sending login request to /api/login with data:', loginData);
      
      const response = await loginClient.post('/login', loginData).catch(error => {
        console.error('Login error:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.code === 'ECONNABORTED') {
          throw new Error('La solicitud está tardando demasiado. Por favor verifica tu conexión a internet.');
        }
        if (!error.response) {
          throw new Error('No se pudo conectar al servidor. Por favor verifica tu conexión a internet.');
        }
        
        // Handle specific API error responses
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        throw new Error('Error en el inicio de sesión. Por favor intenta de nuevo.');
      });
      
      const { data } = response;
      
      if (!data.token) {
        throw new Error('No se recibió un token de autenticación');
      }
      
      setIsAuthenticated(true);
      
      // The API returns user data in a nested 'user' object
      const { token, user: userData } = data;
      
      if (!userData) {
        throw new Error('No se recibieron los datos del usuario');
      }
      
      // Create complete user object with all required fields
      const user = {
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
      
      console.log('Login successful, user data:', { token, user });
      
      // Return the response in the expected format for AuthContext
      return { token, user };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error en el inicio de sesión';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error, isAuthenticated };
}
