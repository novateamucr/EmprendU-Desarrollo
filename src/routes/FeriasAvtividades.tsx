import { Layout } from '../components/layout/Layout';
import footerHero from "../assets/hero-w.png";
import { Search } from '@mui/icons-material';
import { useState } from 'react';
import { FeriaCard } from '../components/FeriaCard';
import { PopupDetalles } from '../components/PopupDetalles';
import img from "../assets/parque.jpg";

export default function FeriasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('Todas');
  const [showPopupDetalles, setShowPopupDetalles] = useState(false);

  const zones = ['San Ramón', 'Cartago', 'Heredia'];

  const feriasParticipando = [
    {
      title: "Actividad de exposición y venta de productos",
      imgUrl: img,
      location: "Parque de San Ramón",
      time: "10:00 am - 6:00 pm",
      actionLabel: "Ver detalles",
    }
  ];

  const handleVerDetalles = () => {
    setShowPopupDetalles(true);
  };

  // Filtrado de ferias según búsqueda y zona
  const filteredFerias = feriasParticipando.filter((feria) => {
    const matchesQuery = feria.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'Todas' || feria.location === selectedZone;
    return matchesQuery && matchesZone;
  });

  return (
    <Layout>
      <div className="pt-24 pb-8 px-4 max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Ferias y Actividades
        </h1>
        <p className="text-secondary mb-8">
          Aquí puedes ver las proximas ferias y adctividades.
        </p>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Buscar "
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

        {/* Participando */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-primary mb-2"></h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFerias.map((feria, i) => (
              <FeriaCard
                key={i}
                title={feria.title}
                imgUrl={feria.imgUrl}
                location={feria.location}
                time={feria.time}
                onButtonClick={handleVerDetalles}
                buttonText={feria.actionLabel}
              />
            ))}
             {filteredFerias.map((feria, i) => (
              <FeriaCard
                key={i}
                title={feria.title}
                imgUrl={feria.imgUrl}
                location={feria.location}
                time={feria.time}
                onButtonClick={handleVerDetalles}
                buttonText={feria.actionLabel}
              />
            ))}
             {filteredFerias.map((feria, i) => (
              <FeriaCard
                key={i}
                title={feria.title}
                imgUrl={feria.imgUrl}
                location={feria.location}
                time={feria.time}
                onButtonClick={handleVerDetalles}
                buttonText={feria.actionLabel}
              />
            ))}
             {filteredFerias.map((feria, i) => (
              <FeriaCard
                key={i}
                title={feria.title}
                imgUrl={feria.imgUrl}
                location={feria.location}
                time={feria.time}
                onButtonClick={handleVerDetalles}
                buttonText={feria.actionLabel}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-brand text-white py-6 rounded-t-2xl mt-12">
          <div className="max-w-6xl mx-auto flex justify-between items-center px-6 md:px-12">
            <p className="text-sm">© 2025 EmprendU. Todos los derechos reservados.</p>
            <img src={footerHero} alt="Logo" className="w-8 p-1 rounded-full" />
          </div>
        </footer>

        {/* Popup de detalles */}
        {showPopupDetalles && (
          <PopupDetalles
            onClose={() => setShowPopupDetalles(false)}
          />
        )}
      </div>
    </Layout>
  );
}
