import footerHero from "../assets/hero-w.png";
import { Search } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { FeriaCard } from '../components/FeriaCard';
import { ConfirmationPopup } from '../components/PopupConfirmacion';
import { PopupEmprendimientos } from '../components/PopupEmprendimientos';
import { PopupDetalles } from '../components/PopupDetalles';
import img from "../assets/parque.jpg";

export default function FeriasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('Todas');

  // Estados para los popups
  const [showPopupEmprendimientos, setShowPopupEmprendimientos] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
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

  const feriasAbiertas = [
    {
      title: "Feria de innovación universitaria",
      imgUrl: img,
      location: "Cartago",
      time: "8:00 am - 4:00 pm",
      actionLabel: "Inscribirse",
    },
    {
      title: "Feria cultural",
      imgUrl: img,
      location: "Heredia",
      time: "9:00 am - 5:00 pm",
      actionLabel: "Inscribirse",
    },
    {
      title: "Feria gastronómica",
      imgUrl: img,
      location: "San Ramón",
      time: "12:00 md - 8:00 pm",
      actionLabel: "Inscribirse",
    }
  ];

  // Función para abrir popup de inscripción
  const handleInscribirse = () => {
    setShowPopupEmprendimientos(true);
  };
const handleVerDetalles = () => {
    setShowPopupDetalles(true);
  };
  

  // Función para continuar al popup de confirmación
  const handleSiguiente = () => {
    setShowPopupEmprendimientos(false);
    setShowConfirmationPopup(true);
  };

  // Dentro de FeriasPage
const handleConfirmar = () => {
  setShowConfirmationPopup(false);
  // Aquí puedes agregar lógica adicional, como marcar la feria como inscrita
  console.log("Inscripción confirmada");
};


  // Scroll al inicio cada vez que se entra a /ferias
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <>
      <div className="pt-24 flex flex-col min-h-full">
        <div className="px-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Ferias y Actividades
        </h1>
        <p className="text-secondary mb-8">
          Aquí puedes encontrar ferias abiertas y en las que estás participando.
        </p>

        {/* Participando */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-primary mb-2">Participando</h2>
          <p className="text-secondary text-sm mb-4">
            Aquí aparecerán las ferias en las que te inscribas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {feriasParticipando.map((feria, i) => (
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

        {/* Ferias abiertas */}
        <section>
          <h2 className="text-lg font-semibold text-primary mb-2">Ferias abiertas</h2>
          <p className="text-secondary text-sm mb-4">
            Aquí aparecerán las ferias en las que puedes inscribirte
          </p>

          {/* Filtros */}
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

          {/* Cards de ferias abiertas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {feriasAbiertas.map((feria, i) => (
              <FeriaCard
                key={i}
                title={feria.title}
                imgUrl={feria.imgUrl}
                location={feria.location}
                time={feria.time}
                onButtonClick={handleInscribirse} // <- aquí abrimos el popup
                buttonText={feria.actionLabel}
              />
            ))}
          </div>
        </section>
        </div>

        {/* Bottom spacer to separate last content from footer */}
        <div className="h-8 md:h-12" />

        {/* Footer */}
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
    onConfirmar={handleConfirmar} // <- Agregado
  />
)}
{/* Popup de detalles */}
{showPopupDetalles && (
  <PopupDetalles
    onClose={() => setShowPopupDetalles(false)}
  />
)}
      </div>
    </>
  );
}
