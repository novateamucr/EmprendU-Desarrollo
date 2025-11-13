import React, { useState, useEffect } from "react";
import { Modal } from '../components/Modal';
import { inscripcionesApi } from '../services/inscripcionesService';
import { Link } from "react-router-dom";
import useFairs from "../hooks/useFairs";
import { deleteFair } from '../services/fairService';

const button = (
  <Link
    to="/admin/añadirferias"
    className="bg-brand text-white rounded-full px-6 py-3 text-base font-medium hover:opacity-90 transition-colors"
  >
    + Añadir feria
  </Link>
);

// Helper to format date safely (supports dd/mm/yyyy and ISO)
const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  // Try dd/mm/yyyy
  const ddmmyyyy = /^([0-3]?\d)\/([01]?\d)\/(\d{4})$/;
  let d: Date | null = null;
  const m = dateString.match(ddmmyyyy);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1; // 0-based
    const year = parseInt(m[3], 10);
    d = new Date(year, month, day);
  } else {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function Gestorferias() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fairToDelete, setFairToDelete] = useState<any | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedFairForParticipants, setSelectedFairForParticipants] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load fairs list
  const { fairs: allFairs, loading, error, refetch } = useFairs({ page: currentPage });
  const [fairs, setFairs] = useState<any[]>(allFairs || []);

  useEffect(() => {
    if (allFairs) setFairs(allFairs);
    // If backend adds pagination later, update totalPages; for now assume single page
    setTotalPages(1);
  }, [allFairs]);

  // Cerrar menú si se hace click fuera
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const filteredFairs = React.useMemo(() => {
    if (!fairs) return [];
    if (!searchTerm.trim()) return fairs;
    const searchLower = searchTerm.toLowerCase().trim();
    return fairs.filter(f =>
      (f.title?.toLowerCase() || '').includes(searchLower) ||
      (f.owner_name?.toLowerCase?.() || '').includes(searchLower)
    );
  }, [fairs, searchTerm]);

  const handleActionClick = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleOptionClick = async (option: string, id: number) => {
    if (option === 'Eliminar') {
      const f = fairs.find(e => e.id === id) || null;
      setFairToDelete(f);
      setShowDeleteModal(true);
      return;
    }
    setOpenMenuId(null);
  };

  const handleViewParticipants = async (id: number) => {
    const f = fairs.find(e => e.id === id) || null;
    if (!f) return;
    setSelectedFairForParticipants(f);
    setParticipants([]);
    setParticipantsLoading(true);
    setOpenMenuId(null);
    try {
      const res = await inscripcionesApi.getByFair(id);
      const data = res && (res.data ?? res);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setParticipants(list);
      setShowParticipantsModal(true);
    } catch (err) {
      console.error('Error obteniendo participantes de la feria', err);
      setParticipants([]);
      setShowParticipantsModal(true); // abrir modal vacío para mostrar mensaje
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fairToDelete) return;
    try {
      await deleteFair(fairToDelete.id);
      setFairs(prev => prev.filter(e => e.id !== fairToDelete.id));
      refetch();
      setShowDeleteModal(false);
      setOpenMenuId(null);
      setFairToDelete(null);
    } catch (error) {
      console.error('Ocurrió un error al eliminar la feria', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="pt-20 px-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        {/* Header y buscador */}
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="text-2xl font-semibold text-primary text-center mb-2">Gestión de ferias</h1>
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-2">
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-full text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="w-full md:w-auto flex justify-end">{button}</div>
          </div>
        </div>

        {/* Tabla para pantallas >=640px */}
        <div className="mt-10 hidden sm:block">
          <table className="w-full text-center border-collapse bg-white rounded-card shadow-soft border border-border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-2">Título</th>
                <th className="py-3 px-2">Propietario</th>
                <th className="py-3 px-2">Fecha</th>
                <th className="py-3 px-2">Estado</th>
                <th className="py-3 px-2">Última modificación</th>
                <th className="py-3 px-2">Añadido en</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {/* ...tu renderizado de filas sigue igual */}
              {loading && fairs.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-gray-500">Cargando ferias...</td></tr>
              )}
              {error && (
                <tr><td colSpan={7} className="py-4 text-center text-red-500">Error: {error.message}</td></tr>
              )}
              {filteredFairs.length === 0 && !loading && (
                <tr><td colSpan={7} className="py-4 text-center text-gray-500">No se encontraron ferias</td></tr>
              )}
              {filteredFairs.map(f => (
                <tr key={f.id} className="relative hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{f.title}</td>
                  <td className="py-3 px-2">{f.owner_name || f.owner?.name || `#${f.user_id}`}</td>
                  <td className="py-3 px-2">{formatDate(f.date)}</td>
                  <td className="py-3 px-2">{(f.is_active === 1 || f.is_active === true) ? 'Activo' : 'Inactivo'}</td>
                  <td className="py-3 px-2">{formatDate(f.updated_at)}</td>
                  <td className="py-3 px-2">{formatDate(f.created_at)}</td>
                  <td className="py-3 px-2 relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleActionClick(f.id); }}
                      className="px-2 py-1 hover:bg-gray-100 rounded-full"
                    >
                      ⋮
                    </button>
                    {openMenuId === f.id && (
                      <div
                        className="absolute right-0 mt-1 z-50 bg-white min-w-[140px] shadow-lg border border-gray-200 rounded-md overflow-hidden animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link to={`/admin/añadirferias/${f.id}`} className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Editar</Link>
                        <button onClick={() => handleViewParticipants(f.id)} className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Ver Participantes</button>
                        <button onClick={() => handleOptionClick("Eliminar", f.id)} className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm">Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards para pantallas <640px */}
        <div className="mt-8 sm:hidden space-y-4">
          {filteredFairs.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow p-4 relative border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-gray-600">Propietario: {f.owner_name || f.owner?.name || `#${f.user_id}`}</p>
                  <p className="text-sm mt-1">Fecha: <span className="font-medium">{formatDate(f.date)}</span></p>
                  <p className="text-sm mt-1">Estado: {(f.is_active === 1 || f.is_active === true) ? 'Sí' : 'No'}</p>
                  <p className="text-xs text-gray-500 mt-1">Última mod.: {formatDate(f.updated_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleActionClick(f.id); }}
                  className="px-2 py-1 hover:bg-gray-100 rounded-full"
                >
                  ⋮
                </button>
                {openMenuId === f.id && (
                  <div
                    className="absolute right-3 top-10 z-50 bg-white min-w-[140px] shadow-lg border border-gray-200 rounded-md overflow-hidden animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to={`/admin/añadirferias/${f.id}`} className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Editar</Link>
                    <button onClick={() => handleViewParticipants(f.id)} className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Ver Participantes</button>
                    <button onClick={() => handleOptionClick("Eliminar", f.id)} className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm">Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
          {/* PAGINACIÓN */}
          <div className="flex justify-center mt-6 gap-2">
            <button
              className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setFairToDelete(null); }}
          title="Confirmar eliminación"
        >
          <div className="space-y-4 text-center">
            <p className="text-lg">¿Desea eliminar la feria <span className="font-semibold">{fairToDelete?.title}</span>?</p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setFairToDelete(null); }}
                className="px-6 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </Modal>
        {/* Modal de participantes */}
        <Modal
          isOpen={showParticipantsModal}
          onClose={() => { setShowParticipantsModal(false); setParticipants([]); setSelectedFairForParticipants(null); }}
          title={`Participantes${selectedFairForParticipants ? ` - ${selectedFairForParticipants.title}` : ''}`}
        >
          <div className="min-w-[320px] max-w-[800px]">
            {participantsLoading ? (
              <p className="py-6 text-center">Cargando participantes...</p>
            ) : participants.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No hay participantes registrados para esta feria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-gray-600">
                      <th className="py-2 px-3">Nombre</th>
                      <th className="py-2 px-3">Emprendimiento</th>
                      
                      <th className="py-2 px-3">Fecha inscripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((ins) => {
                      const nombre = ins?.user?.name ?? ins?.user_name ?? ins?.nombre ?? (ins?.first_name && ins?.last_name ? `${ins.first_name} ${ins.last_name}` : '-');
                      const emp = ins?.emprendimiento?.name ?? ins?.emprendimiento_name ?? ins?.entrepreneurship?.name ?? '-';
                      const fecha = formatDate(ins?.created_at ?? ins?.date ?? ins?.fecha ?? null);
                      return (
                        <tr key={ins.id ?? `${ins.user_id}-${ins.emprendimiento_id}-${Math.random()}`} className="border-t">
                          <td className="py-2 px-3 align-top">{nombre}</td>
                          <td className="py-2 px-3 align-top">{emp}</td>
                          
                          <td className="py-2 px-3 align-top">{fecha}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      </div>
      
  );  
}
