import { api } from '../lib/api';

export interface Business {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  category_relation?: {
    nombre: string;
  };
}

// Normalizamos la respuesta para siempre devolver un objeto con la forma { business: Business | null }
export const featuredBusinessApi = {
  getToday: async (): Promise<{ business: Business | null }> => {
    try {
  const response = await api.get('/featured-business/today');

      // Si la API devuelve { business: ... }
      if (response.data && response.data.business !== undefined) {
        return { business: response.data.business || null };
      }

      // Si la API devuelve directamente el objeto del negocio
      if (response.data && response.data.id) {
        return { business: response.data };
      }

      // No hay negocio destacado
      return { business: null };
    } catch (error: any) {
      // Logueamos el error para debugging y devolvemos un resultado vacío para no romper la UI
      console.error('Error fetching featured business:', error?.response?.status, error?.message || error);
      return { business: null };
    }
  },
};
