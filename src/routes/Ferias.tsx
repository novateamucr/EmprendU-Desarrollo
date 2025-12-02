
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
import Footer from "../components/footer/Footer";

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
  const [userEntrepreneurships, setUserEntrepreneurships] = useState<Entrepreneurship[]>([]);
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

  // Helper para extraer id de emprendimiento desde una inscripción (robusto a distintas formas)
  const getInsEntrepreneurshipId = (ins: any) =>
    ins?.emprendimiento?.id ?? ins?.emprendimiento ?? ins?.entrepreneurship?.id ?? ins?.entrepreneurship ?? ins?.emprendimiento_id ?? ins?.entrepreneurship_id ?? null;

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
      // Obtener inscripciones del usuario para esta feria (tener datos frescos)
      let userIns: any[] = [];
      try {
        const insRes = await inscripcionesApi.getByUser(authUser.id);
        const insData = insRes && (insRes.data ?? insRes);
        userIns = Array.isArray(insData) ? insData : [];
      } catch (err) {
        console.warn('No se pudieron obtener inscripciones del usuario antes de filtrar emprendimientos', err);
        userIns = [];
      }

      const res = await entrepreneurshipApi.getAll({ page: 1, per_page: 50, user_id: authUser.id });
      const items: Entrepreneurship[] = Array.isArray(res)
        ? (res as unknown as Entrepreneurship[])
        : Array.isArray((res as any).data)
        ? (res as any).data
        : Array.isArray((res as any).data?.data)
        ? (res as any).data.data
        : [];

      // Filtrar los emprendimientos que ya estén inscritos por el usuario en la feria seleccionada
  const filtered = items.filter((e: Entrepreneurship) => {
        const already = userIns.some((ins) => {
          const feriaId = ins?.fair_id ?? ins?.feria_id ?? ins?.feriaId ?? null;
          const emprendId = getInsEntrepreneurshipId(ins);
          return feriaId === fair.id && emprendId === e.id;
        });
        return !already;
      });

      setFetchedEntrepreneurships(filtered);
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
      toast.success("Inscripción registrada con exito.");

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

  // Cargar emprendimientos del usuario (para determinar qué ferias ocultar)
  const fetchUserEntrepreneurships = async () => {
    if (!isAuthenticated || !authUser) return;
    try {
      const res = await entrepreneurshipApi.getAll({ page: 1, per_page: 100, user_id: authUser.id });
      const items: Entrepreneurship[] = Array.isArray(res)
        ? (res as unknown as Entrepreneurship[])
        : Array.isArray((res as any).data)
        ? (res as any).data
        : Array.isArray((res as any).data?.data)
        ? (res as any).data.data
        : [];
      setUserEntrepreneurships(items);
    } catch (err) {
      console.error('Error fetching user entrepreneurships', err);
      setUserEntrepreneurships([]);
    }
  };

  useEffect(() => {
    fetchUserInscripciones();
    fetchUserEntrepreneurships();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [authUser]);

  // Filtrar ferias: ocultar ferias en las que el usuario ya inscribió todos sus emprendimientos
  const visibleFairs = useMemo(() => {
    // Si no hay ferias abiertas o no hay emprendimientos del usuario, mostrar todo
    if (!fairs || fairs.length === 0) return openFairs;
    if (!userEntrepreneurships || userEntrepreneurships.length === 0) return openFairs;

    const userEmpIds = userEntrepreneurships.map((e) => e.id);

    return openFairs.filter((fair) => {
      // obtener inscripciones del usuario para esta feria
      const insForFair = userInscripciones.filter((ins) => (ins?.fair_id ?? ins?.feria_id ?? ins?.feriaId) === fair.id);
      const registeredIds = insForFair
        .map((ins) => getInsEntrepreneurshipId(ins))
        .map((id) => (typeof id === 'string' ? Number(id) : id))
        .filter(Boolean) as number[];

      // Si el usuario no tiene emprendimientos registrados en esta feria -> mostrar
      if (registeredIds.length === 0) return true;

      // Si todos los emprendimientos del usuario están incluidos en registeredIds, ocultar
      const allRegistered = userEmpIds.every((id) => registeredIds.includes(id));
      return !allRegistered;
    });
  }, [openFairs, userEntrepreneurships, userInscripciones, fairs]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 3xl:px-12 4xl:px-16 mt-12 md:mt-16 dark:bg-backgroundDark">
      <div className="w-full">
        <h1 className="text-xl sm:text-2xl md:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold text-primary mb-2 text-center md:text-left dark:text-white">
          Ferias y Actividades
        </h1>

        {userInscripciones.length > 0 && (
          <section className="mb-6">
            <h3 className="text-md md:text-lg 3xl:text-xl 4xl:text-2xl font-semibold text-primary mb-2 dark:text-white">Mis inscripciones</h3>
            <p className="text-secondary mb-8 text-sm md:text-base 3xl:text-lg 4xl:text-xl dark:text-secondaryDark">
              Aquí puedes encontrar ferias abiertas y en las que estás participando.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-5 gap-4 3xl:gap-6 4xl:grid-cols-5 mb-4">
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

  <h2 className="text-lg md:text-xl 3xl:text-2xl 4xl:text-3xl font-semibold text-primary mb-2 dark:text-white">Ferias abiertas</h2>
  <p className="text-secondary mb-8 text-sm md:text-base 3xl:text-lg 4xl:text-xl dark:text-secondaryDark">Aquí aparecerán las ferias en las que puedes inscribirte</p>

        {/* 🔍 Buscador + filtros (provincia y cantón) */}
  <div className="flex flex-col lg:flex-row flex-wrap items-center justify-between gap-4 mb-8">
          <div className="relative flex-grow lg:flex-[2] min-w-[250px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary dark:text-secondaryDark 4xl:scale-110" />
            <input
              type="text"
              placeholder="Buscar feria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 md:py-4 3xl:py-5 4xl:py-6 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white text-base 3xl:text-lg 4xl:text-xl dark:bg-cardDark dark:text-white dark:border-cardDark"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-56 3xl:w-64 4xl:w-72">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedCanton("Todos los cantones");
                }}
                className="w-full px-3 py-3 md:py-4 3xl:py-5 4xl:py-6 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white text-base 3xl:text-lg 4xl:text-xl dark:bg-cardDark dark:text-white dark:border-cardDark"
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-56 3xl:w-64 4xl:w-72">
              <select
                value={selectedCanton}
                onChange={(e) => setSelectedCanton(e.target.value)}
                className="w-full px-3 py-3 md:py-4 3xl:py-5 4xl:py-6 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white text-base 3xl:text-lg 4xl:text-xl dark:bg-cardDark dark:text-white dark:border-cardDark"
              >
                {cantons.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 🧩 Lista de ferias */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-5 gap-6 3xl:gap-8 4xl:gap-10">
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
            <p className="text-secondary col-span-full text-center py-8 text-sm md:text-base 3xl:text-lg 4xl:text-xl dark:text-secondaryDark">
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
          userEntrepreneurshipsCount={userEntrepreneurships.length}
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
