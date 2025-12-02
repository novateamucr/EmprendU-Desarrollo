import React, { useState, useEffect, useRef } from "react";
import { Modal } from '../components/Modal';
import { Link, useNavigate } from "react-router-dom";
import useUsers from "../hooks/useUsers";
import { api } from "../lib/api";
import { toast } from "react-hot-toast";

const button = (
  <Link
    to="/admin/usuarios/nuevo"
    className="bg-brand dark:bg-brandDark dark:hover:bg-brand dark:hover:text-white text-white rounded-full px-5 py-2 md:px-6 md:py-3 text-sm md:text-base font-medium hover:bg-brandDark transition-colors focus-brand w-full md:w-auto text-center"
  >
    + Añadir usuario
  </Link>
);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getRoleName = (roleId: number) => {
  switch (roleId) {
    case 1: return 'Comprador';
    case 2: return 'Emprendedor';
    case 3: return 'Admin';
    default: return 'Usuario';
  }
};

export default function GestorUsuarios() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  type UsuarioType = typeof usuarios extends (infer U)[] ? U : any;
  const [userToDelete, setUserToDelete] = useState<UsuarioType | null>(null);

  const { users: allUsers, loading, error, pagination, refetch } = useUsers({ page: currentPage });

  // 🔹 Referencia para el menú abierto
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // debug: log target and whether menu contains it
      try {
        // eslint-disable-next-line no-console
        console.debug('GestorUsuarios: outside click target=', event.target, 'menuRef=', menuRef.current);
      } catch {}
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    // Use 'click' so inner click handlers execute before outside close in edge cases
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (allUsers) setUsuarios(allUsers);
    if (pagination && pagination.last_page) setTotalPages(pagination.last_page);
  }, [allUsers, pagination]);

  const filteredUsers = React.useMemo(() => {
    if (!usuarios) return [];
    if (!searchTerm.trim()) return usuarios;
    const searchLower = searchTerm.toLowerCase().trim();
    return usuarios.filter(user =>
      (user.name?.toLowerCase() || '').includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower)
    );
  }, [usuarios, searchTerm]);

  const handleActionClick = (userId: number) => {
    // eslint-disable-next-line no-console
    console.debug('GestorUsuarios: toggle menu', userId, 'currentOpen=', openMenuId);
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  const handleOptionClick = async (option: string, userId: number) => {
    // eslint-disable-next-line no-console
    console.debug('GestorUsuarios: option click', option, userId);
    if (option === 'Eliminar') {
      const user = usuarios.find(u => u.id === userId) || null;
      setUserToDelete(user);
      setShowDeleteModal(true);
      return;
    }
    try {
      if (!userId && userId !== 0) {
        console.error('GestorUsuarios: invalid userId for option', option, userId);
        return;
      }
      // Use axios instance to include auth token and shared config
      if (option === 'Habilitar' || option === 'Deshabilitar') {
        const isBanning = option === 'Deshabilitar';
        // Some backends expect numeric 0/1; send both boolean and numeric for compatibility
        const payload = { banned: isBanning, banned_numeric: isBanning ? 1 : 0 } as any;
        // debug
        // eslint-disable-next-line no-console
        console.debug('GestorUsuarios: calling PUT /users/', userId, payload);
        // Optimistic update
        const prevState = usuarios;
        setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, banned: isBanning } : u));
        let res;
        try {
          res = await api.put(`/users/${userId}`, payload);
        } catch (err) {
          // If server returns 500, try PATCH as a fallback
          // eslint-disable-next-line no-console
          if ((err as any)?.response?.status === 500) {
            console.warn('PUT failed with 500, trying PATCH as fallback', userId);
            res = await api.patch(`/users/${userId}`, payload);
          } else {
            // Revert optimistic update
            setUsuarios(prevState);
            throw err;
          }
        }
        // update local state optimistically
        if (res.status >= 200 && res.status < 300) {
          refetch();
          toast.success(isBanning ? 'Usuario deshabilitado' : 'Usuario habilitado');
        } else {
          // Revert on unexpected status
          setUsuarios(prevState);
          throw new Error('Error en actualización');
        }
        setOpenMenuId(null);
        return;
      }
    } catch (error) {
      // axios error handling
      // eslint-disable-next-line no-console
      if ((error as any)?.response) {
        const resp = (error as any).response;
        console.error('API Error (PUT /users):', resp.status, resp.data);
        try {
          const msg = resp.data?.message || resp.data?.error || JSON.stringify(resp.data);
          // eslint-disable-next-line no-alert
          alert(`Error al actualizar usuario: ${msg}`);
          toast.error('No se pudo actualizar el estado del usuario');
        } catch {}
      } else {
        console.error('Error in handleOptionClick:', error);
        // eslint-disable-next-line no-alert
        alert('Ocurrió un error al procesar la solicitud');
        toast.error('Ocurrió un error al procesar la solicitud');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      // eslint-disable-next-line no-console
      console.debug('GestorUsuarios: calling DELETE /users/', userToDelete.id);
      let res;
      try {
        res = await api.delete(`/users/${userToDelete.id}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        if ((err as any)?.response?.status === 500) {
          console.warn('DELETE failed with 500, trying POST _method=DELETE fallback', userToDelete.id);
          // Some backends accept method override via form/body
          res = await api.post(`/users/${userToDelete.id}`, { _method: 'DELETE' });
        } else {
          throw err;
        }
      }
      if (res.status < 200 || res.status >= 300) throw new Error('Error al eliminar usuario');
      setUsuarios(prev => prev.filter(u => u.id !== userToDelete.id));
      refetch();
      setShowDeleteModal(false);
      setOpenMenuId(null);
      setUserToDelete(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      if ((error as any)?.response) {
        const resp = (error as any).response;
        console.error('API Error (DELETE /users):', resp.status, resp.data);
        // mostrar mensaje al usuario si viene del servidor
        try {
          const msg = resp.data?.message || resp.data?.error || JSON.stringify(resp.data);
          // eslint-disable-next-line no-alert
          alert(`Error al eliminar usuario: ${msg}`);
        } catch {}
      } else {
        console.error('Ocurrió un error al eliminar el usuario', error);
        // eslint-disable-next-line no-alert
        alert('Ocurrió un error al eliminar el usuario');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-backgroundDark px-3 sm:px-6">
      <div className="pt-20 max-w-6xl mx-auto pb-24 lg:pb-8">
        {/* ENCABEZADO */}
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="text-xl md:text-2xl font-semibold text-primary dark:text-white text-center mb-2">Gestión de usuarios</h1>
          <div className="h-0.5 w-24 bg-brand/40 rounded self-center md:self-start" />

          {/* BUSCADOR + BOTÓN */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
            <h3 className="text-base md:text-lg font-medium text-secondary text-center md:text-left">
              Usuarios: {filteredUsers?.length || 0}
            </h3>
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 md:py-3 bg-white dark:bg-cardDark border border-border dark:border-cardDark rounded-full text-sm md:text-base text-secondary dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            {button}
          </div>
        </div>

        {/* TABLA */}
          <div className="mt-8 overflow-x-auto rounded-card border border-border shadow-soft bg-white dark:bg-cardDark dark:border-cardDark hidden sm:block">
          <table className="min-w-full text-center border-collapse text-sm md:text-base">
            <thead className="bg-gray-50 dark:bg-cardDark dark:text-white">
              <tr>
                <th className="py-3 px-2">Nombre</th>
                <th className="py-3 px-2">Correo</th>
                <th className="py-3 px-2">Tipo</th>
                <th className="py-3 px-2">Estado</th>
                <th className="py-3 px-2">Última modificación</th>
                <th className="py-3 px-2">Añadido en</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && allUsers.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-secondary">Cargando usuarios...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="py-4 text-red-500">Error: {error.message}</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-secondary">No se encontraron usuarios</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-brand/10 dark:hover:bg-gray-700">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{user.name}</td>
                    <td className="py-3 px-2 text-gray-700 dark:text-secondaryDark">{user.email}</td>
                    <td className="py-3 px-2 text-gray-700 dark:text-secondaryDark">{getRoleName(user.role)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.banned ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                        {user.banned ? 'Deshabilitado' : 'Habilitado'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-700 dark:text-secondaryDark">{formatDate(user.updated_at)}</td>
                    <td className="py-3 px-2 text-gray-700 dark:text-secondaryDark">{formatDate(user.created_at)}</td>
                    <td className="py-3 px-2 relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleActionClick(user.id); }}
                        className="px-2 py-1 hover:bg-brand/10 rounded-full focus-brand"
                      >
                        ⋮
                      </button>
                      {openMenuId === user.id && (
                        <div ref={menuRef} className="absolute right-0 mt-1 z-50 bg-white dark:bg-cardDark dark:text-white min-w-[140px] shadow-lg border border-border dark:border-cardDark rounded-md overflow-hidden animate-fadeIn">
                          <button onClick={() => { navigate(`/profile/edit/${user.id}`); setOpenMenuId(null); setTimeout(() => { if (window.location.pathname !== `/profile/edit/${user.id}`) window.location.href = `/profile/edit/${user.id}`; }, 120); }} className="block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-brand/10 text-sm dark:text-white">Editar</button>
                          <button onClick={() => handleOptionClick("Eliminar", user.id)} className="block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-brand/10 text-red-600 dark:text-red-400 text-sm">Eliminar</button>
                          <button
                            onClick={() => handleOptionClick(user.banned ? 'Habilitar' : 'Deshabilitar', user.id)}
                            className={`block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-brand/10 text-sm ${user.banned ? 'text-green-600 dark:text-green-300' : 'text-yellow-600 dark:text-yellow-300'}`}
                          >
                            {user.banned ? 'Habilitar' : 'Deshabilitar'}
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

        {/* VISTA CARD */}
        <div className="mt-8 space-y-4 sm:hidden">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow p-4 relative border border-border dark:bg-cardDark dark:border-cardDark">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-secondaryDark">{user.email}</p>
                  <p className="text-sm mt-1">Rol: <span className="font-medium">{getRoleName(user.role)}</span></p>
                  <p className="text-sm mt-1">Estado:{" "}
                    <span className={`font-semibold ${user.banned ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {user.banned ? "Deshabilitado" : "Habilitado"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1 dark:text-secondaryDark">
                    Última mod.: {formatDate(user.updated_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleActionClick(user.id); }}
                  className="px-2 py-1 hover:bg-brand/10 rounded-full"
                >
                  ⋮
                </button>
                {openMenuId === user.id && (
                  <div ref={menuRef} className="absolute right-3 top-10 z-50 bg-white dark:bg-cardDark dark:text-white min-w-[140px] shadow-lg border border-border dark:border-cardDark rounded-md overflow-hidden animate-fadeIn">
                    <button onClick={() => { navigate(`/profile/edit/${user.id}`); setOpenMenuId(null); setTimeout(() => { if (window.location.pathname !== `/profile/edit/${user.id}`) window.location.href = `/profile/edit/${user.id}`; }, 120); }} className="block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-brand/10 text-sm dark:text-white">Editar</button>
                    <button onClick={() => handleOptionClick("Eliminar", user.id)} className="block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-brand/10 text-red-600 dark:text-red-400 text-sm">Eliminar</button>
                    <button
                      onClick={() => handleOptionClick(user.banned ? 'Habilitar' : 'Deshabilitar', user.id)}
                      className={`block w-full px-4 py-2 text-left hover:bg-brand/10 dark:hover:bg-brand/10 text-sm ${user.banned ? 'text-green-600 dark:text-green-300' : 'text-yellow-600 dark:text-yellow-300'}`}
                    >
                      {user.banned ? 'Habilitar' : 'Deshabilitar'}
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
            className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50 dark:bg-cardDark dark:text-white"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-brand text-white dark:bg-brandDark' : 'bg-brand/10 text-brand dark:bg-cardDark dark:text-white'}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50 dark:bg-cardDark dark:text-white"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>

        {/* MODAL */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setUserToDelete(null); }}
          title="Confirmar eliminación"
        >
          <div className="space-y-4 text-center">
            <p className="text-lg">¿Desea eliminar la cuenta de <span className="font-semibold">{userToDelete?.name}</span>?</p>
            <div className="flex justify-center gap-4 pt-4">
              <button onClick={handleConfirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">Sí</button>
              <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2 bg-brand/10 text-secondary rounded-lg font-medium hover:bg-brand/20 transition-colors">No</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
