import footerHero from "../assets/hero-w.png";
import { Search } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { FeriaCard } from "../components/FeriaCard";
import { ConfirmationPopup } from "../components/PopupConfirmacion";
import { PopupEmprendimientos } from "../components/PopupEmprendimientos";
import { PopupDetalles } from "../components/PopupDetalles";
import img from "../assets/parque.jpg";
import { useFairs } from '../context/FairsContext';
import { Fair } from '../services/fairService';

export default function Ferias() {
  const { fairs } = useFairs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("Todas");

  const [showPopupEmprendimientos, setShowPopupEmprendimientos] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showPopupDetalles, setShowPopupDetalles] = useState(false);

  const zones = ["San Ramón", "Cartago", "Heredia", "San José"];

  // Funciones para popups
  const handleInscribirse = () => setShowPopupEmprendimientos(true);
  const handleVerDetalles = () => setShowPopupDetalles(true);
  const handleSiguiente = () => {
    setShowPopupEmprendimientos(false);
    setShowConfirmationPopup(true);
  };
  const handleConfirmar = () => {
    setShowConfirmationPopup(false);
    console.log("Inscripción confirmada");
  };

  // Filtrado de fairs abiertas según búsqueda y zona
  const openFairs = fairs.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedZone === "Todas" || f.province === selectedZone)
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="pt-24 flex flex-col min-h-full">
      <div className="px-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Fairs y Actividades
        </h1>
        <p className="text-secondary mb-8">
          Aquí puedes encontrar fairs abiertas y en las que estás participando.
        </p>

        {/* Fairs abiertas */}
        <section>
          <h2 className="text-lg font-semibold text-primary mb-2">Fairs abiertas</h2>
          <p className="text-secondary text-sm mb-4">
            Aquí aparecerán las fairs en las que puedes inscribirte
          </p>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
              <input
                type="text"
                placeholder="Buscar fair..."
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
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards de fairs abiertas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {openFairs.map((fair: Fair) => (
              <FeriaCard
                key={fair.id}
                title={fair.title}
                imgUrl={fair.image || img}
                location={fair.location}
                time={fair.time}
                onButtonClick={handleInscribirse}
                buttonText="Inscribirse"
              />
            ))}
          </div>
        </section>
      </div>

      <div className="h-8 md:h-12" />

      <footer className="bg-brand text-white py-6 mt-auto rounded-t-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 md:px-12">
          <p className="text-sm">© 2025 EmprendU. Todos los derechos reservados.</p>
          <img src={footerHero} alt="Logo" className="w-8 p-1 rounded-full" />
        </div>
      </footer>

      {/* Popups */}
      {showPopupEmprendimientos && (
        <PopupEmprendimientos
          onClose={() => setShowPopupEmprendimientos(false)}
          onSiguiente={handleSiguiente}
        />
      )}
      {showConfirmationPopup && (
        <ConfirmationPopup
          onClose={() => setShowConfirmationPopup(false)}
          onConfirmar={handleConfirmar}
        />
      )}
      {showPopupDetalles && <PopupDetalles onClose={() => setShowPopupDetalles(false)} />}
    </div>
  );
}