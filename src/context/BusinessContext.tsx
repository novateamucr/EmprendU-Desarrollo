import { createContext, useContext, useState, ReactNode } from 'react';
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

  // Business loading logic has been moved to the component level
  // to prevent unwanted API calls

  const refreshBusiness = async () => {
    try {
      if (selectedBusiness) {
        const business = await entrepreneurshipApi.getById(selectedBusiness.id.toString());
        setSelectedBusiness(business);
        return business;
      }
      // If no business is selected, return undefined instead of fetching all
      return undefined;
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
