import { useState, useEffect } from 'react';
import { productApi } from '../services/entrepreneurshipService';
import { getAllProducts } from '../services/productService';

// productApi returns a Product type defined in entrepreneurshipService which may differ
// from the Product type in productService. Use `any` here to avoid cross-module type issues.
type AnyProduct = any;

const useProducts = () => {
  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use getAllProducts which handles pagination internally
      const allProducts = await getAllProducts();
      setProducts(allProducts);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  return { 
    products, 
    loading, 
    error, 
    refetch: fetchProducts,
    // Add empty pagination object for backward compatibility
    pagination: {
      currentPage: 1,
      totalPages: 1,
      perPage: products.length,
      total: products.length
    }
  };
};

export default useProducts;
