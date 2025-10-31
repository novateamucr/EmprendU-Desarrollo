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

// Minimal payload for creation
export interface CreateEntrepreneurshipPayload {
  name: string;
  description: string;
  category: number;
  image_url?: string | null;
  user_id: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
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
  // Nuevo: categoría opcional por id proveniente del backend
  category_id?: number;
  image_url: string | null;
  entrepreneurship_id: number;
  entrepreneurship?: {
    id: number;
    name: string;
    image_url?: string | null;
    // Add other necessary fields from Entrepreneurship
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
      const response = await api.get<PaginatedResponse<Entrepreneurship>>(
        '/entrepreneurships',
        {
          params: {
            ...(params || {}),
            page: params?.page ?? 1,
            per_page: params?.per_page ?? 15,
          },
        }
      );
      return response.data as any;
    } catch (error) {
      console.error('Error fetching entrepreneurships:', error);
      throw error;
    }
  },

  // Get a single entrepreneurship by ID with relationships
  getById: async (id: string): Promise<Entrepreneurship> => {
    try {
      const response = await api.get(`/entrepreneurships/${id}`, {
        params: {
          include: 'owner,category_relation,products,favorites',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching business ${id}:`, error);
      throw error;
    }
  },

  // Create a new entrepreneurship
  create: async (
    businessData: Pick<Entrepreneurship, 'name' | 'description' | 'category' | 'image_url' | 'user_id'>
  ): Promise<Entrepreneurship> => {
    try {
      const formData = new FormData();
      
      // Append only allowed primitive fields
      const allowed: (keyof Entrepreneurship)[] = ['name', 'description', 'category', 'image_url', 'user_id'];
      allowed.forEach((key) => {
        const value = businessData[key as keyof typeof businessData];
        if (value !== undefined && value !== null) {
          formData.append(String(key), String(value as any));
        }
      });
      
      const response = await api.post('/entrepreneurships', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating entrepreneurship:', error);
      throw error;
    }
  },

  // Update an entrepreneurship
  update: async (id: string, entrepreneurshipData: Partial<Entrepreneurship>): Promise<Entrepreneurship> => {
    try {
      const formData = new FormData();
      
      // Append all business data to formData
      Object.entries(entrepreneurshipData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert non-string values to strings for FormData
          const formValue = typeof value === 'boolean' ? String(value) : 
                          (value as string | Blob);
          formData.append(key, formValue);
        }
      });
      // Explicitly include the id in the payload (backend reads it from body)
      formData.append('id', id);

      // Use PATCH to the resource URL to satisfy Laravel route-model binding
      const response = await api.patch(
        `/entrepreneurships/${id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating entrepreneurship ${id}:`, error);
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

      const allowed: (keyof Product)[] = ['name','description','long_description','price','image_url','category_id'];
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
      const allowed: (keyof Product)[] = ['entrepreneurship_id','name','description','long_description','price','image_url','category_id'];
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
    throw new Error(`Status update not supported by backend for product ${productId}`);
  },

  category: categoryApi,
};
