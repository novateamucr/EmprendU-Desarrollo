import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Fair, fairApi } from '../services/fairService';

interface FairsContextType {
  fairs: Fair[];
  refreshFairs: () => Promise<void>;
}

const FairsContext = createContext<FairsContextType | undefined>(undefined);

export function FairsProvider({ children }: { children: ReactNode }) {
  const [fairs, setFairs] = useState<Fair[]>([]);

  const loadFairs = async () => {
    try {
      const data = await fairApi.getAll();
      setFairs(data);
    } catch (error) {
      console.error('Error cargando fairs:', error);
    }
  };

  useEffect(() => {
    loadFairs();
  }, []);

  const refreshFairs = async () => {
    await loadFairs();
  };

  return (
    <FairsContext.Provider value={{ fairs, refreshFairs }}>
      {children}
    </FairsContext.Provider>
  );
}

export function useFairs() {
  const context = useContext(FairsContext);
  if (!context) {
    throw new Error('useFairs must be used within a FairsProvider');
  }
  return context;
}