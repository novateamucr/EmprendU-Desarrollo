import React, { useState } from "react";
import { Modal } from '../components/Modal';
import { Link } from "react-router-dom";
import useUsers from "../hooks/useUsers";

const button = (
  <Link
    to="/añadir-usuario"
    className="bg-black text-white rounded-full px-6 py-3 text-base font-medium hover:opacity-90 transition-colors"
  >
    + Añadir usuario
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

// Map role numbers to role names
const getRoleName = (roleId: number) => {
  switch (roleId) {
    case 1: return 'Comprador';
    case 2: return 'Emprendedor';
    case 3: return 'Admin';
    default: return 'Usuario';
  }
};



export default function GestorUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Tipar correctamente el usuario a eliminar
  type UsuarioType = typeof usuarios extends (infer U)[] ? U : any;
  const [userToDelete, setUserToDelete] = useState<UsuarioType | null>(null);

  // Use the useUsers hook to fetch real user data
  const { users: allUsers, loading, error, refetch } = useUsers();
  // Estado local para usuarios editable
  const [usuarios, setUsuarios] = useState(allUsers || []);

  // Sincronizar usuarios locales cuando cambian los usuarios globales
  React.useEffect(() => {
    if (allUsers) setUsuarios(allUsers);
  }, [allUsers]);

  // Filter users based on search term
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
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  const handleOptionClick = async (option: string, userId: number) => {
    if (option === 'Eliminar') {
      const user = usuarios.find(u => u.id === userId) || null;
      setUserToDelete(user);
      setShowDeleteModal(true);
      return;
    }
    try {
      let response;
      const apiUrl = "http://emprendu-backend.test";

      switch (option) {
        case 'Habilitar':
        case 'Deshabilitar': {
          const isBanning = option === 'Deshabilitar';
          response = await fetch(`${apiUrl}/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banned: isBanning })
          });
          if (response.ok) {
            setUsuarios(prev => prev.map(u =>
              u.id === userId ? { ...u, banned: isBanning } : u
            ));
          }
          break;
        }
        default:
          setOpenMenuId(null);
          return;
      }

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud');
      }

      // Refresh the user list
      refetch();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const apiUrl = "http://emprendu-backend.test";
      const response = await fetch(`${apiUrl}/api/users/${userToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar usuario');
      setUsuarios(prev => prev.filter(u => u.id !== userToDelete.id));
      refetch();
      setShowDeleteModal(false);
      setOpenMenuId(null);
      setUserToDelete(null);
      
    } catch (error) {
        console.error('Ocurrió un error al eliminar el usuario');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="pt-20 px-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="text-2xl font-semibold text-primary text-center mb-2">Gestión de usuarios</h1>
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-2">
            <h3 className="text-lg font-medium text-secondary">Usuarios: {filteredUsers?.length || 0}</h3>
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
                <th className="py-3 px-2">Nombre completo</th>
                <th className="py-3 px-2">Correo electrónico</th>
                <th className="py-3 px-2">Tipo</th>
                <th className="py-3 px-2">Estado</th>
                <th className="py-3 px-2">Última modificación</th>
                <th className="py-3 px-2">Añadido en</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && allUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-red-500">
                    Error al cargar los usuarios: {error.message}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="relative hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">{user.email}</td>
                    <td className="py-3 px-2">{getRoleName(user.role)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {user.banned ? 'Deshabilitado' : 'Habilitado'}
                      </span>
                    </td>
                    <td className="py-3 px-2">{formatDate(user.updated_at)}</td>
                    <td className="py-3 px-2">{formatDate(user.created_at)}</td>
                    <td className="py-3 px-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(user.id);
                        }}
                        className="px-2 py-1 hover:bg-gray-100 rounded-full"
                        aria-label="Acciones"
                      >
                        ⋮
                      </button>
                      {openMenuId === user.id && (
                        <div
                          className="absolute right-0 mt-1 z-50 bg-white min-w-[140px] shadow-lg border border-gray-200 rounded-md overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/perfil/editar/${user.id}`}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                          >
                            Editar
                          </Link>
                          <button
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm"
                            onClick={() => handleOptionClick("Eliminar", user.id)}
                          >
                            Eliminar
                          </button>
                          <button
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm ${user.banned ? 'text-green-600' : 'text-yellow-600'
                              }`}
                            onClick={() => handleOptionClick(
                              user.banned ? 'Habilitar' : 'Deshabilitar',
                              user.id
                            )}
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
        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setUserToDelete(null); }}
          title="Confirmar eliminación"
        >
          <div className="space-y-4 text-center">
            <p className="text-lg">¿Desea eliminar la cuenta de <span className="font-semibold">{userToDelete?.name}</span>?</p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
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
};
