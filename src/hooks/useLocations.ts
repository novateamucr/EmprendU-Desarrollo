import { useState, useEffect } from 'react';
import { getProvincias, getCantones, getDistritos, ApiLocation, ApiCanton, ApiDistrito } from '../services/locations';

export function useLocations() {
  const [provincias, setProvincias] = useState<ApiLocation[]>([]);
  const [cantones, setCantones] = useState<ApiCanton[]>([]);
  const [distritos, setDistritos] = useState<ApiDistrito[]>([]);
  const [loading, setLoading] = useState({
    provincias: false,
    cantones: false,
    distritos: false
  });

  // Cargar provincias al montar
  useEffect(() => {
    setLoading(prev => ({ ...prev, provincias: true }));
    getProvincias()
      .then(setProvincias)
      .finally(() => setLoading(prev => ({ ...prev, provincias: false })));
  }, []);

  const loadCantones = async (provincia: string) => {
    setLoading(prev => ({ ...prev, cantones: true }));
    setCantones([]);
    setDistritos([]);
    
    try {
      const data = await getCantones(provincia);
      setCantones(data);
    } finally {
      setLoading(prev => ({ ...prev, cantones: false }));
    }
  };

  const loadDistritos = async (provincia: string, canton: string) => {
    setLoading(prev => ({ ...prev, distritos: true }));
    setDistritos([]);
    
    try {
      const data = await getDistritos(provincia, canton);
      setDistritos(data);
    } finally {
      setLoading(prev => ({ ...prev, distritos: false }));
    }
  };

  return {
    provincias,
    cantones,
    distritos,
    loading,
    loadCantones,
    loadDistritos
  };
}
