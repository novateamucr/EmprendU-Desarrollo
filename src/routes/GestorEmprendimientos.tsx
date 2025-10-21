import React, { useState } from "react";
import { Modal } from '../components/Modal';
import { Link } from "react-router-dom";

import useEntrepreneurships from "../hooks/useEntrepreneurships";

const button = (
  <Link
    to="/admin/emprendimientos/nuevo"
    className="bg-brand text-white rounded-full px-6 py-3 text-base font-medium hover:opacity-90 transition-colors"
  >
    + Añadir emprendimiento
  </Link>
);

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function GestorEmprendimientos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entrepreneurshipToDelete, setEntrepreneurshipToDelete] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Usar el hook de emprendimientos con paginación
  const { entrepreneurships: allEntrepreneurships, loading, error, pagination, refetch } = useEntrepreneurships({ page: currentPage });
  const [entrepreneurships, setEntrepreneurships] = useState(allEntrepreneurships || []);

  React.useEffect(() => {
    if (allEntrepreneurships) setEntrepreneurships(allEntrepreneurships);
    if (pagination && (pagination.last_page || pagination.lastPage)) setTotalPages(pagination.last_page || pagination.lastPage);
  }, [allEntrepreneurships, pagination]);

  // Filtrar emprendimientos por nombre, propietario o categoría
  const filteredEntrepreneurships = React.useMemo(() => {
    if (!entrepreneurships) return [];
    if (!searchTerm.trim()) return entrepreneurships;
    const searchLower = searchTerm.toLowerCase().trim();
    return entrepreneurships.filter(e =>
      (e.name?.toLowerCase() || '').includes(searchLower) ||
      (e.owner?.name?.toLowerCase() || '').includes(searchLower) ||
      (e.category_relation?.nombre?.toLowerCase() || '').includes(searchLower)
    );
  }, [entrepreneurships, searchTerm]);

  const handleActionClick = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleOptionClick = async (option: string, id: number) => {
    if (option === 'Eliminar') {
      const ent = entrepreneurships.find(e => e.id === id) || null;
      setEntrepreneurshipToDelete(ent);
      setShowDeleteModal(true);
      return;
    }
    // Aquí puedes agregar lógica para habilitar/deshabilitar emprendimientos si la API lo permite
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!entrepreneurshipToDelete) return;
    try {
      const apiUrl = "https://emprendu-desarrollo-production.up.railway.app";
      const response = await fetch(`${apiUrl}/api/entrepreneurships/${entrepreneurshipToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar emprendimiento');
      setEntrepreneurships(prev => prev.filter(e => e.id !== entrepreneurshipToDelete.id));
      refetch();
      setShowDeleteModal(false);
      setOpenMenuId(null);
      setEntrepreneurshipToDelete(null);
    } catch (error) {
      console.error('Ocurrió un error al eliminar el emprendimiento');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      
      <div className="pt-20 px-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="text-2xl font-semibold text-primary text-center mb-2">Gestión de emprendimientos</h1>
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
            <div className="w-full md:w-auto flex justify-end">
              {button}
            </div>
          </div>
        </div>
        <div className="mt-10">
          <table className="w-full text-center border-collapse bg-white rounded-card shadow-soft border border-border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-2">Nombre</th>
                <th className="py-3 px-2">Propietario</th>
                <th className="py-3 px-2">Categoría</th>
                <th className="py-3 px-2">Última modificación</th>
                <th className="py-3 px-2">Añadido en</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && entrepreneurships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Cargando emprendimientos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-red-500">
                    Error al cargar los emprendimientos: {error.message}
                  </td>
                </tr>
              ) : filteredEntrepreneurships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    No se encontraron emprendimientos
                  </td>
                </tr>
              ) : (
                filteredEntrepreneurships.map(ent => (
                  <tr key={ent.id} className="relative hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          <div className="font-medium">{ent.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">{ent.owner?.name || '-'}</td>
                    <td className="py-3 px-2">{ent.category_relation?.nombre || '-'}</td>
                    <td className="py-3 px-2">{formatDate(ent.updated_at)}</td>
                    <td className="py-3 px-2">{formatDate(ent.created_at)}</td>
                    <td className="py-3 px-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(ent.id);
                        }}
                        className="px-2 py-1 hover:bg-gray-100 rounded-full"
                        aria-label="Acciones"
                      >
                        ⋮
                      </button>
                      {openMenuId === ent.id && (
                        <div
                          className="absolute right-0 mt-1 z-50 bg-white min-w-[140px] shadow-lg border border-gray-200 rounded-md overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/admin/emprendimientos/nuevo/${ent.id}`}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                          >
                            Editar
                          </Link>
                          <button
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm"
                            onClick={() => handleOptionClick("Eliminar", ent.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          onClose={() => { setShowDeleteModal(false); setEntrepreneurshipToDelete(null); }}
          title="Confirmar eliminación"
        >
          <div className="space-y-4 text-center">
            <p className="text-lg">¿Desea eliminar el emprendimiento <span className="font-semibold">{entrepreneurshipToDelete?.name}</span>?</p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setEntrepreneurshipToDelete(null); }}
                className="px-6 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
