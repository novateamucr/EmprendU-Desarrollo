import { api } from '../lib/api'; // igual que tu ejemplo de users

export interface Fair {
  id: number;
  title: string;
  location: string;
  time: string;
  image?: string;
  province: string;
  canton: string;
  district: string;
}

export const fairApi = {
  getAll: async (): Promise<Fair[]> => {
    const response = await api.get('/fairs');
    // Ajusta según tu backend
    return Array.isArray(response.data) ? response.data : response.data.data;
  },
};