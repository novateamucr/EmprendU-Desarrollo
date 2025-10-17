
import { Search } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { FeriaCard } from "../components/FeriaCard";
import { ConfirmationPopup } from "../components/PopupConfirmacion";
import { PopupEmprendimientos } from "../components/PopupEmprendimientos";
import { PopupDetalles } from "../components/PopupDetalles";
import img from "../assets/parque.jpg";
import { useFairs } from '../context/FairsContext';
import { inscripcionesApi } from '../services/inscripcionesService';
import { Fair } from '../services/fairService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { entrepreneurshipApi, Entrepreneurship } from '../services/entrepreneurshipService';
import Footer from "@/components/footer/Footer";

export default function Ferias() {
  const { fairs } = useFairs();
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [fetchedEntrepreneurships, setFetchedEntrepreneurships] = useState<Entrepreneurship[]>([]);
  const [loadingEntrepreneurships, setLoadingEntrepreneurships] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Todas las provincias");
  const [selectedCanton, setSelectedCanton] = useState("Todos los cantones");
  const [userInscripciones, setUserInscripciones] = useState<any[]>([]);
  const [showPopupEmprendimientos, setShowPopupEmprendimientos] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showPopupDetalles, setShowPopupDetalles] = useState(false);
  const [selectedFair, setSelectedFair] = useState<Fair | null>(null);
  const [selectedEntrepreneurshipId, setSelectedEntrepreneurshipId] = useState<number | null>(null);
  const [lastInscripcion, setLastInscripcion] = useState<any | null>(null);
  const [selectedEntrepreneurshipObj, setSelectedEntrepreneurshipObj] = useState<Entrepreneurship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Provincias y cantones dinámicos
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

  // Aplicar filtros
  const openFairs = fairs.filter((f) => {
    const matchesQuery = f.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvince =
      selectedProvince === "Todas las provincias" || f.province === selectedProvince;
    const matchesCanton =
      selectedCanton === "Todos los cantones" || f.canton === selectedCanton;
    return matchesQuery && matchesProvince && matchesCanton;
  });

  // Función para inscribirse
  const handleInscribirse = async (fair: Fair) => {
    setSelectedFair(fair);
    setSelectedEntrepreneurshipId(null);
    setLoadingEntrepreneurships(true);

    if (!isAuthenticated || !authUser) {
      toast.info('Debes iniciar sesión para ver tus emprendimientos');
      setLoadingEntrepreneurships(false);
      navigate('/login');
      return;
    }

    toast.info('Cargando emprendimientos...');
    try {
      const res = await entrepreneurshipApi.getAll({ page: 1, per_page: 50, user_id: authUser.id });
      const items = Array.isArray(res)
        ? res
        : Array.isArray((res as any).data)
        ? (res as any).data
        : Array.isArray((res as any).data?.data)
        ? (res as any).data.data
        : [];
      setFetchedEntrepreneurships(items);
      setShowPopupEmprendimientos(true);
    } catch (err) {
      console.error('Error fetching entrepreneurships for user', err);
      toast.error('No se pudieron cargar tus emprendimientos. Intenta de nuevo.');
    } finally {
      setLoadingEntrepreneurships(false);
    }
  };

  const handleSiguiente = () => {
    setShowPopupEmprendimientos(false);
    setShowConfirmationPopup(true);
  };

  const handleConfirmar = async (feriaId: number, emprendimientoId: number) => {
    if (!isAuthenticated || !authUser) {
      toast.info('Necesitas estar autenticado para inscribirte.');
      return;
    }
    if (!feriaId || !emprendimientoId) {
      toast.error('Falta información para completar la inscripción.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await inscripcionesApi.create({
        user_id: authUser.id,
        feria_id: feriaId,
        emprendimiento_id: emprendimientoId,
      });

      const created = res && (res.data ?? res);
      toast.success("Inscripción completada correctamente ✅");

      setShowConfirmationPopup(false);
      setShowPopupEmprendimientos(false);

      setLastInscripcion(created);
      const chosen = fetchedEntrepreneurships.find((e) => e.id === emprendimientoId) ?? null;
      setSelectedEntrepreneurshipObj(chosen);
      setUserInscripciones((prev) => [...prev, created]);
    } catch (error) {
      console.error('Error creating inscription:', error);
      toast.error('Error al crear la inscripción. Intenta nuevamente más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar inscripciones del usuario
  const fetchUserInscripciones = async () => {
    if (!isAuthenticated || !authUser) return;
    try {
      const res = await inscripcionesApi.getByUser(authUser.id);
      const data = res && (res.data ?? res);
      setUserInscripciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching user inscripciones', err);
    }
  };

  useEffect(() => {
    fetchUserInscripciones();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [authUser]);

  return (
    <div className="w-full px-6 sm:px-12 md:px-20 lg:px-32 mt-16 md:mt-20">
      <div className="w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Ferias y Actividades
        </h1>

        {userInscripciones.length > 0 && (
          <section className="mb-6">
            <h3 className="text-md font-semibold text-primary mb-2">Mis inscripciones</h3>
            <p className="text-secondary mb-8">
              Aquí puedes encontrar ferias abiertas y en las que estás participando.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {userInscripciones.map((ins) => {
                const feria = fairs.find((f) => f.id === (ins.fair_id ?? ins.feria_id));
                if (!feria) return null;
                const emprend = ins.emprendimiento ?? ins.entrepreneurship ?? null;
                return (
                  <FeriaCard
                    key={`ins-${ins.id}`}
                    title={feria.title}
                    imgUrl={feria.image ?? img}
                    location={feria.location}
                    time={feria.time}
                    buttonText="Ver detalles"
                    onButtonClick={() => {
                      setSelectedFair(feria);
                      setSelectedEntrepreneurshipObj(emprend ?? null);
                      setLastInscripcion(ins);
                      setShowPopupDetalles(true);
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

        <h2 className="text-lg font-semibold text-primary mb-2">Ferias abiertas</h2>
        <p className="text-secondary mb-8">Aquí aparecerán las ferias en las que puedes inscribirte</p>

        {/* 🔍 Buscador + filtros (provincia y cantón) */}
        <div className="flex flex-col lg:flex-row flex-wrap items-center justify-between gap-4 mb-8">
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

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
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
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-56">
              <select
                value={selectedCanton}
                onChange={(e) => setSelectedCanton(e.target.value)}
                className="w-full px-3 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
              >
                {cantons.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 🧩 Lista de ferias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {openFairs.length > 0 ? (
            openFairs.map((fair: Fair) => (
              <FeriaCard
                key={fair.id}
                title={fair.title}
                imgUrl={fair.image || img}
                location={fair.location}
                time={fair.time}
                onButtonClick={() => handleInscribirse(fair)}
                buttonText="Inscribirse"
              />
            ))
          ) : (
            <p className="text-secondary col-span-full text-center py-8">
              No se encontraron ferias.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Popups */}
      {showPopupEmprendimientos && (
        <PopupEmprendimientos
          onClose={() => setShowPopupEmprendimientos(false)}
          onSiguiente={handleSiguiente}
          entrepreneurships={fetchedEntrepreneurships}
          loading={loadingEntrepreneurships}
          selectedId={selectedEntrepreneurshipId}
          onSelect={(id) => setSelectedEntrepreneurshipId(id)}
        />
      )}
      {showConfirmationPopup && (
        <ConfirmationPopup
          onClose={() => setShowConfirmationPopup(false)}
          onConfirmar={async (feriaId: number, emprendimientoId: number) => {
            await handleConfirmar(feriaId, emprendimientoId);
            setShowConfirmationPopup(false);
          }}
          fair={selectedFair}
          entrepreneurship={fetchedEntrepreneurships.find((e) => e.id === selectedEntrepreneurshipId) ?? null}
        />
      )}
      {showPopupDetalles && (
        <PopupDetalles
          onClose={() => setShowPopupDetalles(false)}
          fair={selectedFair}
          entrepreneurship={selectedEntrepreneurshipObj}
          inscription={lastInscripcion}
        />
      )}
    </div>
  );
}
