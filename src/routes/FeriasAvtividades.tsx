import footerHero from "../assets/hero-w.png";
import { Search } from "@mui/icons-material";
import { useState, useMemo } from "react";
import { FeriaCard } from "../components/FeriaCard";
import { VerDetalles } from "../components/VerDetalles";
import { useFairs } from "../context/FairsContext";

export default function FeriasPage() {
  const { fairs } = useFairs();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Todas las provincias");
  const [selectedCanton, setSelectedCanton] = useState("Todos los cantones");
  const [selectedFeria, setSelectedFeria] = useState<any>(null);
  const [showPopupDetalles, setShowPopupDetalles] = useState(false);

  const provinces = useMemo(() => {
    const list = fairs.map((f) => f.province).filter(Boolean);
    return ["Todas las provincias", ...Array.from(new Set(list))];
  }, [fairs]);

  const cantons = useMemo(() => {
    const list =
      selectedProvince === "Todas las provincias"
        ? fairs.map((f) => f.canton).filter(Boolean)
        : fairs.filter((f) => f.province === selectedProvince).map((f) => f.canton).filter(Boolean);

    return ["Todos los cantones", ...Array.from(new Set(list))];
  }, [fairs, selectedProvince]);

  const filteredFerias = fairs.filter((feria) => {
    const matchesQuery = feria.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvince =
      selectedProvince === "Todas las provincias" || feria.province === selectedProvince;
    const matchesCanton =
      selectedCanton === "Todos los cantones" || feria.canton === selectedCanton;
    return matchesQuery && matchesProvince && matchesCanton;
  });

  const handleVerDetalles = (feria: any) => {
    setSelectedFeria(feria);
    setShowPopupDetalles(true);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mt-12 md:mt-16">
      <div className="w-full">
        {/* Título */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2 text-center md:text-left">
          Ferias y Actividades
        </h1>
        <p className="text-secondary mb-8 text-center md:text-left">
          Aquí puedes ver las próximas ferias y actividades.
        </p>

        {/* 🔍 Buscador + filtros */}
        <div className="flex flex-col lg:flex-row flex-wrap items-center justify-between gap-4 mb-8">
          {/* Buscador (más largo que los filtros) */}
          <div className="relative flex-grow lg:flex-[2] min-w-[250px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Buscar feria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
            />
          </div>

          {/* Filtros (más pequeños que el buscador) */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Provincia */}
            <div className="w-full sm:w-56">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedCanton("Todos los cantones");
                }}
                className="w-full px-3 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantón */}
            <div className="w-full sm:w-56">
              <select
                value={selectedCanton}
                onChange={(e) => setSelectedCanton(e.target.value)}
                className="w-full px-3 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
              >
                {cantons.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 🧩 Lista de ferias */}
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFerias.length > 0 ? (
              filteredFerias.map((feria) => (
                <FeriaCard
                  key={feria.id}
                  title={feria.title}
                  imgUrl={feria.image ?? "img/default.jpg"}
                  location={`${feria.location}`}
                  time={`${feria.time ?? ""}`}
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

      {/* Footer */}
      <footer className="bg-brand text-white py-6 mt-auto rounded-t-2xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-6 md:px-12 text-center md:text-left">
          <p className="text-sm">© 2025 EmpowerUp. Todos los derechos reservados.</p>
          <img src={footerHero} alt="Logo" className="w-8 p-1 rounded-full" />
        </div>
      </footer>

      {/* Popup Detalles */}
      {showPopupDetalles && selectedFeria && (
        <VerDetalles feria={selectedFeria} onClose={() => setShowPopupDetalles(false)} />
      )}
    </div>
  );
}
