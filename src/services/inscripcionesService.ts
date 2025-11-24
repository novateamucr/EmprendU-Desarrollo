import { api } from '../lib/api';

export const inscripcionesApi = {
  // Registrar inscripción
  create: async (data: { user_id: number; feria_id: number; emprendimiento_id: number }) => {
    const response = await api.post('/inscripciones', data);
    return response.data;
  },

  // Obtener inscripciones de un usuario
  getByUser: async (userId: number) => {
    const response = await api.get(`/inscripciones/${userId}`);
    return response.data;
  },

  // Obtener inscripciones para una feria (participantes)
  getByFair: async (fairId: number) => {
    const response = await api.get(`/inscripciones/feria/${fairId}`);
    return response.data;
  },

  // Cancelar inscripción
  delete: async (inscripcionId: number) => {
    const response = await api.delete(`/inscripciones/${inscripcionId}`);
    return response.data;
  },
};
