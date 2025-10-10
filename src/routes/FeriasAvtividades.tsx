import footerHero from "../assets/hero-w.png";
import { Search } from '@mui/icons-material';
import { useState } from 'react';
import { FeriaCard } from '../components/FeriaCard';
import { VerDetalles } from '../components/VerDetalles';
import { useFairs } from "../context/FairsContext";

export default function FeriasPage() {
  const { fairs } = useFairs();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('Todas');
  const [selectedFeria, setSelectedFeria] = useState<any>(null);
  const [showPopupDetalles, setShowPopupDetalles] = useState(false);

  const zones = ['San Ramón', 'Cartago', 'Heredia'];

  
  const filteredFerias = fairs.filter((feria) => {
    const matchesQuery = feria.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'Todas' || feria.location === selectedZone;
    return matchesQuery && matchesZone;
  });

  const handleVerDetalles = (feria: any) => {
    setSelectedFeria(feria);
    setShowPopupDetalles(true);
  };

  return (
    <div className="pt-24 flex flex-col min-h-full">
      <div className="px-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Ferias y Actividades
        </h1>
        <p className="text-secondary mb-8">
          Aquí puedes ver las próximas ferias y actividades.
        </p>

        
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Buscar feria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
            >
              <option value="Todas">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>

        
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFerias.length > 0 ? (
              filteredFerias.map((feria) => (
                <FeriaCard
                  key={feria.id}
                  title={feria.title}
                  imgUrl={feria.image ?? "img/default.jpg"}
                  location={feria.location}
                  time={feria.time}
                  buttonText="Ver detalles"
                  onButtonClick={() => handleVerDetalles(feria)}
                />
              ))
            ) : (
              <p className="text-secondary col-span-full text-center py-8">
                No se encontraron ferias.
              </p>
            )}
          </div>
        </section>
      </div>

      
      <footer className="bg-brand text-white py-6 mt-auto rounded-t-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 md:px-12">
          <p className="text-sm">© 2025 EmprendU. Todos los derechos reservados.</p>
          <img src={footerHero} alt="Logo" className="w-8 p-1 rounded-full" />
        </div>
      </footer>

      
      {showPopupDetalles && selectedFeria && (
        <VerDetalles feria={selectedFeria} onClose={() => setShowPopupDetalles(false)} />
      )}
    </div>
  );  
}
