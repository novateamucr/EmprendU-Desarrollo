import { api } from '../lib/api';

// Types
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  email_verified_at: string | null;
  password: string;
  role: number;
  phone: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  address: string | null;
  banned: boolean;
  avatar_url: string | null;
  remember_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export interface Entrepreneurship {
  id: number;
  name: string;
  description: string;
  category: number;
  image_url: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  owner: User;
  category_relation: Category;
  products: any[];
  // Additional fields
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  banned?: boolean;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string | null;
  from: number;
  last_page: number;
  last_page_url?: string | null;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
  [key: string]: any; // Allow additional query parameters
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  long_description?: string | null;
  sku: string;
  price: number;
  cost: number | null;
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock';
  category: string;
  // Categoría opcional por id proveniente del backend
  category_id?: number;
  image_url: string | null;
  entrepreneurship_id: number;
  entrepreneurship?: {
    id: number;
    name: string;
    image_url?: string | null;
    // Add other necessary fields from Entrepreneurship
    description: string;
    category: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    owner: User;
    category_relation: Category;
  };
}

// Category API
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/categories');
      const data = (response.data && Array.isArray(response.data.data)) ? response.data.data : response.data;
      return data as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};


// Entrepreneurship API
export const entrepreneurshipApi = {
  // Get all entrepreneurships with pagination
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Entrepreneurship>> => {
    try {
      const response = await api.get(
        '/entrepreneurships',
        {
          params: {
            ...(params || {}),
            page: params?.page ?? 1,
            per_page: params?.per_page ?? 15,
            include: 'owner,category_relation,products,favorites',
          },
        }
      );

      // Handle both direct data and nested data response formats
      const responseData = response.data;

      // If the response already has pagination structure, return it as is
      if (responseData && 'data' in responseData && 'current_page' in responseData) {
        return responseData;
      }

      // If the response is just the data array, wrap it in a pagination structure
      if (Array.isArray(responseData)) {
        return {
          data: responseData,
          current_page: 1,
          from: 1,
          to: responseData.length,
          total: responseData.length,
          per_page: responseData.length,
          last_page: 1,
          first_page_url: null,
          last_page_url: null,
          next_page_url: null,
          prev_page_url: null,
          path: '/entrepreneurships',
          links: []
        };
      }

      // If we get here, the response format is unexpected
      throw new Error('Formato de respuesta inesperado');
    } catch (error) {
      console.error('Error fetching entrepreneurships:', error);
      throw error;
    }
  },

  // Get a single entrepreneurship by ID with relationships
  getById: async (id: string): Promise<Entrepreneurship> => {
    try {
      const response = await api.get<{ data: Entrepreneurship }>(`/entrepreneurships/${id}`, {
        params: {
          include: 'owner,category_relation,products,favorites',
        },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching business ${id}:`, error);
      throw error;
    }
  },

  // Create a new entrepreneurship with file upload support
  create: async (formData: FormData): Promise<Entrepreneurship> => {
    try {
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Log form data for debugging
      console.log('Sending form data with keys:', Array.from(formData.keys()));

      const response = await api.post<{ data: Entrepreneurship }>('/entrepreneurships', formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
          // Let the browser set the Content-Type with the correct boundary
        },
        withCredentials: true,
      });

      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error creating entrepreneurship:', error);

      // If we have a 422 validation error, extract and format the error messages
      if (error.response?.status === 422 && error.response?.data) {
        const errorData = error.response.data;
        let errorMessage = 'Por favor corrige los siguientes errores:\n\n';

        // Mapear los errores a mensajes en español
        const errorMessages: Record<string, string> = {
          name: 'El nombre es obligatorio y debe ser claro y descriptivo.',
          description: 'La descripción es obligatoria y debe tener al menos 50 caracteres.',
          category: 'Debes seleccionar una categoría válida.',
          user_id: 'Debes seleccionar un usuario válido.',
          image: 'La imagen es obligatoria.',
          'image_url': 'La imagen es obligatoria.'
        };

        // Check for field-specific errors
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            const fieldName = field.replace('_', ' ');
            const message = Array.isArray(messages) ? messages.join(' ') : String(messages);
            errorMessage += `• ${errorMessages[field] || `${fieldName}: ${message}`}\n`;
          });
        } else if (errorData.message) {
          // Fallback to the general error message
          errorMessage = errorData.message;
        }

        // Create a new error with the formatted message
        const validationError = new Error(errorMessage);
        validationError.name = 'ValidationError';
        throw validationError;
      }

      // For other types of errors, rethrow them
      throw error;
    }
  },

  // Update an entrepreneurship with file upload support
  update: async (id: string, formData: FormData): Promise<Entrepreneurship> => {
    try {
      formData.append('_method', 'PUT'); // Laravel way to handle PUT/PATCH with FormData
      const response = await api.post<{ data: Entrepreneurship }>(`/entrepreneurships/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`Error updating business ${id}:`, error);

      // If we have a 422 validation error, extract and format the error messages
      if (error.response?.status === 422 && error.response?.data) {
        const errorData = error.response.data;
        let errorMessage = 'Por favor corrige los siguientes errores:\n\n';

        // Mapear los errores a mensajes en español
        const errorMessages: Record<string, string> = {
          name: 'El nombre es obligatorio y debe ser claro y descriptivo.',
          description: 'La descripción es obligatoria y debe tener al menos 50 caracteres.',
          category: 'Debes seleccionar una categoría válida.',
          user_id: 'Debes seleccionar un usuario válido.',
          image: 'La imagen es obligatoria.',
          'image_url': 'La imagen es obligatoria.'
        };

        // Check for field-specific errors
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            const fieldName = field.replace('_', ' ');
            const message = Array.isArray(messages) ? messages.join(' ') : String(messages);
            errorMessage += `• ${errorMessages[field] || `${fieldName}: ${message}`}\n`;
          });
        } else if (errorData.message) {
          // Fallback to the general error message
          errorMessage = errorData.message;
        }

        // Create a new error with the formatted message
        const validationError = new Error(errorMessage);
        validationError.name = 'ValidationError';
        throw validationError;
      }

      // For other types of errors, rethrow them
      throw error;
    }
  },

  // Delete an entrepreneurship
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/entrepreneurships/${id}`);
    } catch (error) {
      console.error(`Error deleting entrepreneurship ${id}:`, error);
      throw error;
    }
  },
};

// Product API
export const productApi = {
  // Get all products with pagination (global listing)
  getAll: async (
    params?: PaginationParams & { category?: string; status?: string; search?: string }
  ): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await api.get<PaginatedResponse<Product>>(
        '/products',
        {
          params: {
            page: params?.page || 1,
            per_page: params?.per_page || 24,
            sort_by: params?.sort_by,
            sort_order: params?.sort_order,
            category: params?.category,
            status: params?.status,
            search: params?.search,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get top selling products
  getTopSelling: async (): Promise<Product[]> => {
    try {
      const response = await api.get<Product[]>('/products/top-selling');
      return response.data;
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      throw error;
    }
  },

  // Get all products for an entrepreneurship with pagination (backend expects query param)
  getByEntrepreneurship: async (
    entrepreneurshipId: string,
    params?: PaginationParams & { search?: string }
  ): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await api.get<PaginatedResponse<Product>>(
        '/products',
        {
          params: {
            page: params?.page || 1,
            per_page: params?.per_page || 15,
            search: params?.search,
            entrepreneurship_id: entrepreneurshipId,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for entrepreneurship ${entrepreneurshipId}:`, error);
      throw error;
    }
  },

  // Get a single product by ID
  getSingle: async (productId: string): Promise<Product> => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },

  // Keep signature but call top-level endpoint to match backend
  getById: async (_entrepreneurshipId: string, productId: string): Promise<Product> => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },


  // Create a new product (backend expects JSON, not multipart)
  create: async (
    entrepreneurshipId: string,
    productData: Partial<Omit<Product, 'id' | 'entrepreneurship_id' | 'entrepreneurship'>> & { image_url?: string }
  ): Promise<Product> => {
    try {
      const payload: Record<string, any> = {
        entrepreneurship_id: entrepreneurshipId,
      };

      const allowed: (keyof Product)[] = ['name', 'description', 'long_description', 'price', 'image_url', 'category_id'];
      allowed.forEach((key) => {
        const v = (productData as any)[key];
        if (v !== undefined) payload[key] = v;
      });

      const response = await api.post<Product>('/products', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update an existing product (JSON to /products/{id})
  update: async (
    _entrepreneurshipId: string,
    productId: string,
    productData: Partial<Omit<Product, 'id' | 'entrepreneurship_id' | 'entrepreneurship'>> & { image_url?: string }
  ): Promise<Product> => {
    try {
      const payload: Record<string, any> = {};
      const allowed: (keyof Product)[] = ['entrepreneurship_id', 'name', 'description', 'long_description', 'price', 'image_url', 'category_id'];
      allowed.forEach((key) => {
        const v = (productData as any)[key];
        if (v !== undefined) payload[key] = v;
      });

      const response = await api.patch<Product>(`/products/${productId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  },

  // Delete a product (top-level route)
  delete: async (_entrepreneurshipId: string, productId: string): Promise<void> => {
    try {
      await api.delete(`/products/${productId}`);
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
  },


  // Update product stock (no backend support currently) — placeholder disabled
  updateStock: async (
    _entrepreneurshipId: string,
    productId: string,
    _stock: number
  ): Promise<Product> => {
    throw new Error(`Stock update not supported by backend for product ${productId}`);
  },


  // Update product status (no backend support currently) — placeholder disabled
  updateStatus: async (
    _entrepreneurshipId: string,
    productId: string,
    _status: 'active' | 'draft' | 'out_of_stock'
  ): Promise<Product> => {
    try {
      const response = await api.put<Product>(`/products/${productId}/status`, {
        status: _status
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for product ${productId}:`, error);
      throw error;
    }
  },

  category: categoryApi,
};
