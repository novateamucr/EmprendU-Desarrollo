import { useState, useEffect } from 'react';
import { productApi } from '../services/entrepreneurshipService';
// productApi returns a Product type defined in entrepreneurshipService which may differ
// from the Product type in productService. Use `any` here to avoid cross-module type issues.
type AnyProduct = any;

interface UseProductsOptions {
  page?: number;
  perPage?: number;
  search?: string;
}

const useProducts = ({ page = 1, perPage = 15 }: UseProductsOptions = {}) => {
  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
  const data = await productApi.getAll({ page, per_page: perPage });
  setProducts((data && data.data) || []);
      setPagination(data);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [page, perPage]);

  return { products, loading, error, pagination, refetch: fetchProducts };
};

export default useProducts;
