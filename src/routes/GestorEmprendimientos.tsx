import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../components/Modal";
import { Link } from "react-router-dom";
import useEntrepreneurships from "../hooks/useEntrepreneurships";
import { entrepreneurshipApi } from "../services/entrepreneurshipService";
import { toast } from "react-hot-toast";

const button = (
  <Link
    to="/admin/emprendimientos/nuevo"
    className="bg-brand dark:bg-brandDark dark:hover:bg-brand dark:hover:text-white text-white rounded-full px-5 py-2 md:px-6 md:py-3 text-sm md:text-base font-medium hover:bg-brandDark transition-colors focus-brand w-full md:w-auto text-center"
  >
    + Añadir emprendimiento
  </Link>
);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function GestorEmprendimientos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entrepreneurshipToDelete, setEntrepreneurshipToDelete] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entrepreneurships, setEntrepreneurships] = useState<any[]>([]);

  const { entrepreneurships: allEntrepreneurships, loading, error, pagination, refetch } =
    useEntrepreneurships({ page: currentPage });

  // 🔹 Referencia para detectar clics fuera del menú
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (allEntrepreneurships) setEntrepreneurships(allEntrepreneurships);
    if (pagination && (pagination.last_page || pagination.lastPage))
      setTotalPages(pagination.last_page || pagination.lastPage);
  }, [allEntrepreneurships, pagination]);

  const filteredEntrepreneurships = React.useMemo(() => {
    if (!entrepreneurships) return [];
    if (!searchTerm.trim()) return entrepreneurships;
    const searchLower = searchTerm.toLowerCase().trim();
    return entrepreneurships.filter(
      (e) =>
        (e.name?.toLowerCase() || "").includes(searchLower) ||
        (e.owner?.name?.toLowerCase() || "").includes(searchLower) ||
        (e.category_relation?.nombre?.toLowerCase() || "").includes(searchLower)
    );
  }, [entrepreneurships, searchTerm]);

  const handleActionClick = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleOptionClick = async (option: string, id: number) => {
    if (option === "Eliminar") {
      const ent = entrepreneurships.find((e) => e.id === id) || null;
      setEntrepreneurshipToDelete(ent);
      setShowDeleteModal(true);
      return;
    }
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!entrepreneurshipToDelete) return;
    try {
      await entrepreneurshipApi.delete(String(entrepreneurshipToDelete.id));
      setEntrepreneurships((prev) => prev.filter((e) => e.id !== entrepreneurshipToDelete.id));
      refetch();
      setShowDeleteModal(false);
      setOpenMenuId(null);
      setEntrepreneurshipToDelete(null);
      toast.success("Emprendimiento eliminado");
    } catch (error) {
      console.error("Ocurrió un error al eliminar el emprendimiento", error);
      toast.error("No se pudo eliminar el emprendimiento");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-backgroundDark px-3 sm:px-6">
      <div className="pt-20 max-w-6xl mx-auto pb-24 lg:pb-8">
        {/* ENCABEZADO */}
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="text-xl md:text-2xl font-semibold text-primary dark:text-white text-center mb-2">
            Gestión de emprendimientos
          </h1>
          <div className="h-0.5 w-24 bg-brand/40 rounded self-center md:self-start" />

          {/* BUSCADOR + BOTÓN */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
            <h3 className="text-base md:text-lg font-medium text-secondary dark:text-gray-300 text-center md:text-left">
              Emprendimientos: {filteredEntrepreneurships?.length || 0}
            </h3>
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 md:py-3 border border-border dark:border-cardDark rounded-full text-sm md:text-base text-secondary dark:text-gray-300 bg-white dark:bg-cardDark focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-brandDark"
              />
            </div>
            {button}
          </div>
        </div>

        {/* TABLA (vista desktop) */}
        <div className="mt-8 overflow-x-auto rounded-card border border-border dark:border-cardDark shadow-soft bg-white dark:bg-cardDark hidden sm:block">
          <table className="min-w-full text-center border-collapse text-sm md:text-base">
            <thead className="bg-gray-50 dark:bg-cardDark">
              <tr>
                <th className="py-3 px-2 dark:text-white">Nombre</th>
                <th className="py-3 px-2 dark:text-white">Propietario</th>
                <th className="py-3 px-2 dark:text-white">Categoría</th>
                <th className="py-3 px-2 dark:text-white">Última modificación</th>
                <th className="py-3 px-2 dark:text-white">Añadido en</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && entrepreneurships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-secondary dark:text-gray-400">
                    Cargando emprendimientos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-4 text-red-500 dark:text-red-400">
                    Error: {error.message}
                  </td>
                </tr>
              ) : filteredEntrepreneurships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-secondary dark:text-gray-400">
                    No se encontraron emprendimientos
                  </td>
                </tr>
              ) : (
                filteredEntrepreneurships.map((ent) => (
                  <tr key={ent.id} className="hover:bg-brand/10 dark:hover:bg-gray-700">
                    <td className="py-3 px-2 font-medium dark:text-white">{ent.name}</td>
                    <td className="py-3 px-2 dark:text-secondaryDark">{ent.owner?.name || "-"}</td>
                    <td className="py-3 px-2 dark:text-secondaryDark">{ent.category_relation?.nombre || "-"}</td>
                    <td className="py-3 px-2 dark:text-secondaryDark">{formatDate(ent.updated_at)}</td>
                    <td className="py-3 px-2 dark:text-secondaryDark">{formatDate(ent.created_at)}</td>
                    <td className="py-3 px-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(ent.id);
                        }}
                        className="px-2 py-1 hover:bg-brand/10 rounded-full focus-brand"
                      >
                        ⋮
                      </button>
                      {openMenuId === ent.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 mt-1 z-50 bg-white dark:bg-cardDark min-w-[140px] shadow-lg border border-border dark:border-cardDark rounded-md overflow-hidden animate-fadeIn"
                        >
                          <Link
                            to={`/admin/emprendimientos/nuevo/${ent.id}`}
                            className="block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-gray-700 text-sm dark:text-white"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleOptionClick("Eliminar", ent.id)}
                            className="block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm"
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
        </div>

        {/* VISTA CARD (móvil) */}
        <div className="mt-8 space-y-4 sm:hidden">
          {filteredEntrepreneurships.map((ent) => (
            <div key={ent.id} className="bg-white dark:bg-cardDark rounded-xl shadow p-4 relative border border-border dark:border-cardDark">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">{ent.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{ent.owner?.name || "-"}</p>
                  <p className="text-sm mt-1 dark:text-gray-300">
                    Categoría: <span className="font-medium">{ent.category_relation?.nombre || "-"}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Última mod.: {formatDate(ent.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(ent.id);
                  }}
                  className="px-2 py-1 hover:bg-brand/10 dark:hover:bg-gray-700 rounded-full"
                >
                  ⋮
                </button>
                {openMenuId === ent.id && (
                  <div
                    className="absolute right-0 mt-1 z-50 bg-white dark:bg-cardDark min-w-[140px] shadow-lg border border-border dark:border-cardDark rounded-md overflow-hidden animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      to={`/admin/emprendimientos/nuevo/${ent.id}`}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleOptionClick("Eliminar", ent.id)}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINACIÓN */}
        <div className="flex flex-wrap justify-center mt-6 gap-2">
          <button
            className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50 dark:bg-gray-700 dark:text-brandDark dark:disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? "bg-brand text-white dark:bg-brandDark dark:text-white" : "bg-brand/10 text-brand dark:bg-gray-700 dark:text-brandDark"
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50 dark:bg-gray-700 dark:text-brandDark dark:disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>

        {/* MODAL */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setEntrepreneurshipToDelete(null);
          }}
          title="Confirmar eliminación"
        >
          <div className="space-y-4 text-center">
            <p className="text-lg dark:text-white">
              ¿Desea eliminar el emprendimiento {" "}
              <span className="font-semibold">{entrepreneurshipToDelete?.name}</span>?
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 bg-brand/10 dark:bg-cardDark text-secondary dark:text-gray-300 rounded-lg font-medium hover:bg-brand/20 dark:hover:bg-gray-700 transition-colors"
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
