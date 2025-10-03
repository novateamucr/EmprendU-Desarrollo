import { api } from '../lib/api';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    // Ajusta según la estructura real de tu backend
    return Array.isArray(response.data) ? response.data : response.data.data;
  },
};
