import axios from 'axios';

// Using Vite's environment variables
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://emprendu-desarrollo-production.up.railway.app/api').replace(/\/+$/, '');
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
  stock_quantity?: number;
  image_url: string;
  entrepreneurship_id: number;
  long_description?: string;
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

/**
 * Fetch all products across all pagination pages
 */
export const getAllProducts = async (): Promise<Product[]> => {
  const results: Product[] = [];
  try {
    let url: string | null = `${API_URL}/products`;
    while (url) {
      const response: { data: PaginatedResponse<Product> } = await axios.get<PaginatedResponse<Product>>(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      results.push(...(response.data.data || []));
      url = response.data.next_page_url;
    }
    return results;
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

/**
 * Fetch products filtered by entrepreneurship on the backend to avoid following paginator URLs.
 */
export const getProductsByEntrepreneurship = async (
  entrepreneurshipId: number,
  perPage: number = 100
): Promise<Product[]> => {
  try {
    const response = await axios.get<PaginatedResponse<Product>>(
      `${API_URL}/products`,
      {
        params: {
          entrepreneurship_id: entrepreneurshipId,
          per_page: perPage,
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching products by entrepreneurship:', error);
    throw error;
  }
};

// Get a single product
// GET /api/products/{product}
export const getProduct = async (id: number): Promise<Product> => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}` , {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      }
    });
    
    console.debug('getProduct response shape:', response.data);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

// Create a new product
// POST /api/products
// Create a new product
// POST /api/products
export const createProduct = async (productData: {
  name: string;
  description: string;
  price: number;
  category_id: number;
  entrepreneurship_id: number;
  long_description?: string;
  image: File;
}): Promise<Product> => {
  const formData = new FormData();
  
  // Append all fields to formData
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('price', productData.price.toString());
  formData.append('category_id', productData.category_id.toString());
  formData.append('entrepreneurship_id', productData.entrepreneurship_id.toString());
  
  if (productData.long_description) {
    formData.append('long_description', productData.long_description);
  }
  
  // Append the image file
  formData.append('image', productData.image);

  try {
    const response = await axios.post(`${API_URL}/products`, formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error creating product:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Handle validation errors
        if (error.response.status === 422 && error.response.data.errors) {
          throw new Error(
            Object.entries(error.response.data.errors)
              .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
              .join('\n')
          );
        }
        throw new Error(error.response.data.message || 'Error creating product');
      }
      throw new Error(error.message || 'Network error while creating product');
    }
    throw error;
  }
};

// In productService.ts - updateProduct function
export const updateProduct = async (
  id: number,
  productData: Partial<Product> & { image?: File }
): Promise<Product> => {
  const formData = new FormData();
  
  // Add _method=PUT for Laravel to handle the request correctly
  formData.append('_method', 'PUT');
  
  // Append all fields to formData if they exist
  formData.append('name', productData.name || '');
  formData.append('description', productData.description || '');
  formData.append('price', productData.price?.toString() || '0');
  formData.append('category_id', '1'); // Default category
  formData.append('entrepreneurship_id', productData.entrepreneurship_id?.toString() || '');
  
  if (productData.long_description) {
    formData.append('long_description', productData.long_description);
  }
  
  // Handle image - only append if it's a File object
  if (productData.image !== undefined) {
    if (productData.image instanceof File) {
      formData.append('image', productData.image);
    }
    // If image is explicitly set to null, we need to remove it
    else if (productData.image === null) {
      formData.append('remove_image', '1');
    }
  } else if (productData.image_url !== undefined) {
    formData.append('image_url', productData.image_url || '');
  }

  try {
    // Use POST instead of PUT since we're using _method=PUT
    const response = await axios.post(`${API_URL}/products/${id}`, formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });

    return response.data.product || response.data;

  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    
    if (axios.isAxiosError(error)) {
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const errorMessage = error.response.data?.message || 'Validation error';
        const validationErrors = error.response.data?.errors 
          ? Object.entries(error.response.data.errors)
              .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
              .join('\n')
          : errorMessage;
        
        throw new Error(validationErrors);
      }
      
      // Handle other API errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    // Handle network errors or other unexpected errors
    throw new Error(error instanceof Error ? error.message : 'Failed to update product');
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
