import { api } from '../lib/api';

// Interface aligned with current DB example
export interface Fair {
  id: number;
  title: string;
  description?: string | null;
  address?: string | null;
  canton?: string | null;
  district?: string | null;
  location?: string | null;
  date?: string | null; // e.g., "08/10/2025" (dd/mm/yyyy)
  time?: string | null; // e.g., "10:00 AM - 5:00pm"
  province?: string | null;
  image?: string | null;
  user_id: number;
  is_active?: boolean | number; // backend may return 1/0
  created_at?: string;
  updated_at?: string;
  // Optional owner relation if API includes it
  owner?: { id: number; name: string } | null;
}

export const fairApi = {
  // GET /api/fairs -> can return array or { data: Fair[] }
  getAll: async (): Promise<Fair[]> => {
    const response = await api.get('/fairs');
    return Array.isArray(response.data) ? response.data : response.data.data;
  },
  // GET /api/fairs/{id}
  getById: async (id: number): Promise<Fair> => {
    const response = await api.get(`/fairs/${id}`);
    return response.data?.data ?? response.data;
  },
  // POST /api/fairs
  create: async (payload: Omit<Fair, 'id' | 'created_at' | 'updated_at' | 'owner'>): Promise<Fair> => {
    const response = await api.post('/fairs', payload);
    return response.data?.data ?? response.data;
  },
  // PUT /api/fairs/{id}
  update: async (id: number, payload: Partial<Fair>): Promise<Fair> => {
    const response = await api.put(`/fairs/${id}` , payload);
    return response.data?.data ?? response.data;
  },
  // DELETE /api/fairs/{id}
  delete: async (id: number): Promise<void> => {
    await api.delete(`/fairs/${id}`);
  }
};

// Backward-friendly named export similar to productService
export const deleteFair = fairApi.delete;