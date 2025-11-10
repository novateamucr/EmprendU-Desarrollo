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
    // Try common patterns: query param or dedicated route
    // First try query param: /inscripciones?fair_id={id}
    try {
      const res = await api.get(`/inscripciones`, { params: { fair_id: fairId, feria_id: fairId } });
      return res.data;
    } catch (err) {
      // Fallback to /inscripciones/feria/{id}
      const res2 = await api.get(`/inscripciones/feria/${fairId}`);
      return res2.data;
    }
  },
};
