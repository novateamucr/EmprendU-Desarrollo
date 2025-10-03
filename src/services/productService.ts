import axios from 'axios';

// Using Vite's environment variables
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://emprendu-backend.test/api').replace(/\/+$/, '');
const API_URL = `${API_BASE_URL}`;

interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
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

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  entrepreneurship_id: number;
  created_at?: string;
  updated_at?: string;
  entrepreneurship?: {
    id: number;
    name: string;
    // Add other entrepreneurship fields as needed
  };
}

// Get all products with pagination
// GET /api/products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<PaginatedResponse<Product>>(`${API_URL}/products`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get a single product
// GET /api/products/{product}
export const getProduct = async (id: number): Promise<Product> => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

// Create a new product
// POST /api/products
export const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  try {
    const response = await axios.post(`${API_URL}/products`, {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      image_url: productData.image_url,
      entrepreneurship_id: productData.entrepreneurship_id
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update a product
// PUT /api/products/{product}
export const updateProduct = async (id: number, productData: Partial<Product>): Promise<Product> => {
  try {
    const response = await axios.put(`${API_URL}/products/${id}`, {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      image_url: productData.image_url,
      // Don't include entrepreneurship_id in update to prevent changing ownership
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

// Delete a product
// DELETE /api/products/{product}
export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/products/${id}`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

/**
 * Upload a product image
 * POST /api/products/upload-image
 */
export const uploadProductImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(`${API_URL}/products/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (response.status !== 200) {
    throw new Error('Failed to upload image');
  }

  return response.data;
};
