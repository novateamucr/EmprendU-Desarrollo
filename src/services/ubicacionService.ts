import { api } from '../lib/api';

// Types for Ubicacion (Additional Location)
export interface Ubicacion {
    id: number;
    user_id: number;
    province: string;  // Backend expects 'province'
    canton: string;
    district: string;  // Backend expects 'district'
    direccion_breve?: string;  // Optional - backend may not require this
    created_at?: string;
    updated_at?: string;
}

export interface CreateLocationPayload {
    user_id: number;
    province: string;
    canton: string;
    district: string;
    direccion_breve?: string;
}

export interface UpdateLocationPayload {
    province?: string;
    canton?: string;
    district?: string;
    direccion_breve?: string;
}

/**
 * List all locations for a specific user
 * GET /api/ubicaciones?user_id={userId}
 */
export async function listUserLocations(userId: number): Promise<Ubicacion[]> {
    try {
        const response = await api.get('/ubicaciones', {
            params: { user_id: userId }
        });

        // Handle different response formats
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        return [];
    } catch (error) {
        console.error('Error fetching user locations:', error);
        throw error;
    }
}

/**
 * Get a specific location by ID
 * GET /api/ubicaciones/{id}
 */
export async function getLocation(id: number): Promise<Ubicacion> {
    try {
        const response = await api.get(`/ubicaciones/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching location ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new location
 * POST /api/ubicaciones
 */
export async function createLocation(payload: CreateLocationPayload): Promise<Ubicacion> {
    try {
        const response = await api.post('/ubicaciones', payload);
        return response.data;
    } catch (error) {
        console.error('Error creating location:', error);
        throw error;
    }
}

/**
 * Update an existing location
 * PUT /api/ubicaciones/{id}
 */
export async function updateLocation(id: number, payload: UpdateLocationPayload): Promise<Ubicacion> {
    try {
        const response = await api.put(`/ubicaciones/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating location ${id}:`, error);
        throw error;
    }
}

/**
 * Delete a location
 * DELETE /api/ubicaciones/{id}
 */
export async function deleteLocation(id: number): Promise<void> {
    try {
        await api.delete(`/ubicaciones/${id}`);
    } catch (error) {
        console.error(`Error deleting location ${id}:`, error);
        throw error;
    }
}
