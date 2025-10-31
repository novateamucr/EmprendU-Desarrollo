import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: number;
  phone: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  address: string | null;
  banned: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  role_relation: {
    id: number;
    nombre: string;
  };
}

interface UsersResponse {
  current_page: number;
  data: User[];
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

interface UseUsersOptions {
  page?: number;
  perPage?: number;
  search?: string;
}

const useUsers = ({ page = 1 }: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<Omit<UsersResponse, 'data'>>({
    current_page: 1,
    first_page_url: '',
    from: 0,
    last_page: 1,
    last_page_url: '',
    links: [],
    next_page_url: null,
    path: '',
    per_page: 15,
    prev_page_url: null,
    to: 0,
    total: 0,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use shared axios instance to ensure auth headers, base URL and interceptors
      const response = await api.get('/users', {
        params: { page },
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data: UsersResponse = response.data?.data ? response.data : response.data;
      
      setUsers(data.data);
      
      // Update pagination info
      const { data: _, ...paginationData } = data;
      setPagination(paginationData);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  return {
    users,
    loading,
    error,
    pagination,
    refetch: fetchUsers,
  };
};

export default useUsers;
