import { useState, useEffect } from 'react';
import { entrepreneurshipApi, Entrepreneurship } from '../services/entrepreneurshipService';

interface UseEntrepreneurshipsOptions {
  page?: number;
  perPage?: number;
  search?: string;
}

const useEntrepreneurships = ({ page = 1, perPage = 15 }: UseEntrepreneurshipsOptions = {}) => {
  const [entrepreneurships, setEntrepreneurships] = useState<Entrepreneurship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchEntrepreneurships = async () => {
    setLoading(true);
    try {
      const data = await entrepreneurshipApi.getAll({ page, per_page: perPage });
      setEntrepreneurships(data.data);
      setPagination(data);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntrepreneurships();
    // eslint-disable-next-line
  }, [page, perPage]);

  return { entrepreneurships, loading, error, pagination, refetch: fetchEntrepreneurships };
};

export default useEntrepreneurships;
