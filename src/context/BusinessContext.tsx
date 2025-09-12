import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { entrepreneurshipApi, Entrepreneurship } from '../services/entrepreneurshipService';

interface BusinessContextType {
  selectedBusiness: Entrepreneurship | null;
  setSelectedBusiness: (business: Entrepreneurship | null) => void;
  loading: boolean;
  error: string | null;
  refreshBusiness: () => Promise<Entrepreneurship | undefined>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [selectedBusiness, setSelectedBusiness] = useState<Entrepreneurship | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const response = await entrepreneurshipApi.getAll({ per_page: 1 });
      if (response?.data?.length > 0) {
        setSelectedBusiness(response.data[0]);
      }
      setError(null);
      return response?.data || [];
    } catch (err) {
      console.error('Error fetching business:', err);
      setError('Error al cargar el negocio');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load initial business if none is selected
  useEffect(() => {
    if (!selectedBusiness) {
      fetchBusiness();
    }
  }, [selectedBusiness]);

  const refreshBusiness = async () => {
    try {
      if (selectedBusiness) {
        const business = await entrepreneurshipApi.getById(selectedBusiness.id.toString());
        setSelectedBusiness(business);
        return business;
      } else {
        // If no business is selected, refresh the list and select the first one
        const businesses = await fetchBusiness();
        if (businesses.length > 0) {
          setSelectedBusiness(businesses[0]);
          return businesses[0];
        }
      }
    } catch (err) {
      console.error('Error refreshing business:', err);
      setError('Error al actualizar la información del negocio');
      throw err;
    }
  };

  return (
    <BusinessContext.Provider 
      value={{ 
        selectedBusiness, 
        setSelectedBusiness, 
        loading, 
        error,
        refreshBusiness 
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
