import { useState } from 'react';

export interface UserRegistrationData {
  name?: string;
  username: string;
  email: string;
  password: string;
  role?: number;
  phone?: string;
  province?: string;
  canton?: string;
  district?: string;
  address?: string;
  avatar_url?: string;
}

export interface UserRegistrationResponse {
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
  created_at: string;
  updated_at: string;
  token?: string;
}

export function useUserRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registerUser = async (userData: UserRegistrationData): Promise<UserRegistrationResponse | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = "http://emprendu-backend.test";
      
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: UserRegistrationResponse = await response.json();
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar usuario';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: number, userData: Partial<UserRegistrationData>): Promise<UserRegistrationResponse | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
        const apiUrl = import.meta.env.API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: UserRegistrationResponse = await response.json();
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar usuario';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return {
    registerUser,
    updateUser,
    loading,
    error,
    success,
    clearError,
    clearSuccess
  };
}
