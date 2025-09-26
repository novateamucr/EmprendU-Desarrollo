import axios from 'axios';

const API_BASE_URL = 'http://emprendu-backend.test';

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
  sku: string;
  price: number;
  cost: number | null;
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock';
  category: string;
  image_url: string | null;
  entrepreneurship_id: number;
  created_at: string;
  updated_at: string;
  entrepreneurship?: {
    id: number;
    name: string;
    // Add other necessary fields from Entrepreneurship
  };
}

// Entrepreneurship API
export const entrepreneurshipApi = {
  // Get all entrepreneurships with pagination
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Entrepreneurship>> => {
    try {
      const response = await axios.get<PaginatedResponse<Entrepreneurship>>(
        `${API_BASE_URL}/api/entrepreneurships`,
        {
          params: {
            page: params?.page || 1,
            per_page: params?.per_page || 15,
            sort_by: params?.sort_by,
            sort_order: params?.sort_order
          },
          withCredentials: true,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching entrepreneurships:', error);
      throw error;
    }
  },

  // Get a single entrepreneurship by ID with relationships
  getById: async (id: string): Promise<Entrepreneurship> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/entrepreneurships/${id}`, {
        withCredentials: true,
        params: {
          include: 'owner,category_relation,products,favorites'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching business ${id}:`, error);
      throw error;
    }
  },

  // Create a new entrepreneurship
  create: async (businessData: Omit<Entrepreneurship, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entrepreneurship> => {
    try {
      const formData = new FormData();
      
      // Append all business data to formData
      Object.entries(businessData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert non-string values to strings for FormData
          const formValue = typeof value === 'boolean' ? String(value) : 
                          (value as string | Blob);
          formData.append(key, formValue);
        }
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/entrepreneurships`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
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
      
      const response = await axios.post(
        `${API_BASE_URL}/api/entrepreneurships/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
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
      await axios.delete(`${API_BASE_URL}/api/entrepreneurships/${id}`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error(`Error deleting entrepreneurship ${id}:`, error);
      throw error;
    }
  },
};

// Product API
export const productApi = {
  // Get all products for an entrepreneurship with pagination
  getByEntrepreneurship: async (
    entrepreneurshipId: string,
    params?: PaginationParams & { category?: string; status?: string; search?: string }
  ): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await axios.get<PaginatedResponse<Product>>(
        `${API_BASE_URL}/api/entrepreneurships/${entrepreneurshipId}/products`,
        {
          params: {
            page: params?.page || 1,
            per_page: params?.per_page || 15,
            sort_by: params?.sort_by,
            sort_order: params?.sort_order,
            category: params?.category,
            status: params?.status,
            search: params?.search
          },
          withCredentials: true,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for entrepreneurship ${entrepreneurshipId}:`, error);
      throw error;
    }
  },

  // Get a single product by ID
  getById: async (entrepreneurshipId: string, productId: string): Promise<Product> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/entrepreneurships/${entrepreneurshipId}/products/${productId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching product ${productId} from entrepreneurship ${entrepreneurshipId}:`,
        error
      );
      throw error;
    }
  },

  // Create a new product
  create: async (
    entrepreneurshipId: string,
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'entrepreneurship_id'> & { image?: File }
  ): Promise<Product> => {
    try {
      const formData = new FormData();
      
      // Add all product data as JSON
      const { image, ...productDataWithoutImage } = productData;
      formData.append('name', productData.name);
      formData.append('description', productData.description || '');
      formData.append('sku', productData.sku);
      formData.append('price', productData.price.toString());
      formData.append('cost', productData.cost?.toString() || '');
      formData.append('stock', productData.stock.toString());
      formData.append('status', productData.status);
      formData.append('category', productData.category);
      
      // Add image if provided
      if (image) {
        formData.append('image', image);
      }
      
      const response = await axios.post<Product>(
        `${API_BASE_URL}/api/entrepreneurships/${entrepreneurshipId}/products`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update a product
  update: async (
    entrepreneurshipId: string, 
    productId: string, 
    productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'entrepreneurship_id'>> & { image?: File }
  ): Promise<Product> => {
    try {
      const formData = new FormData();
      
      // Add all product data as JSON
      const { image, ...productDataWithoutImage } = productData;
      
      // Only append fields that are defined
      if (productData.name !== undefined) formData.append('name', productData.name);
      if (productData.description !== undefined) formData.append('description', productData.description || '');
      if (productData.sku !== undefined) formData.append('sku', productData.sku);
      if (productData.price !== undefined) formData.append('price', productData.price.toString());
      if (productData.cost !== undefined) formData.append('cost', productData.cost?.toString() || '');
      if (productData.stock !== undefined) formData.append('stock', productData.stock.toString());
      if (productData.status !== undefined) formData.append('status', productData.status);
      if (productData.category !== undefined) formData.append('category', productData.category);
      
      // Add image if provided
      if (image) {
        formData.append('image', image);
      }
      
      const response = await axios.post<Product>(
        `${API_BASE_URL}/api/entrepreneurships/${entrepreneurshipId}/products/${productId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  },

  // Delete a product
  delete: async (entrepreneurshipId: string, productId: string): Promise<void> => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/entrepreneurships/${entrepreneurshipId}/products/${productId}`,
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error(
        `Error deleting product ${productId} from entrepreneurship ${entrepreneurshipId}:`,
        error
      );
      throw error;
    }
  },

  // Update product stock
  updateStock: async (
    entrepreneurshipId: string,
    productId: string,
    stock: number
  ): Promise<Product> => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/entrepreneurships/${entrepreneurshipId}/products/${productId}/stock`,
        { stock },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating stock for product ${productId} in entrepreneurship ${entrepreneurshipId}:`,
        error
      );
      throw error;
    }
  },

  // Update product status
  updateStatus: async (
    entrepreneurshipId: string, 
    productId: string, 
    status: 'active' | 'draft' | 'out_of_stock'
  ): Promise<Product> => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/entrepreneurships/${entrepreneurshipId}/products/${productId}/status`,
        { status },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating status for product ${productId} in entrepreneurship ${entrepreneurshipId}:`,
        error
      );
      throw error;
    }
  },
};

// Export all APIs
export default {
  entrepreneurship: entrepreneurshipApi,
  product: productApi,
};
