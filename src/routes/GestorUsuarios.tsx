import React, { useState } from "react";
import { Navbar } from '../components/navbar';
import { Link } from "react-router-dom";
import { Person } from '@mui/icons-material';
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
    case 1: return 'Usuario';
    case 2: return 'Emprendedor';
    case 3: return 'Admin';
    default: return 'Usuario';
  }
};



export default function GestorUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Use the useUsers hook to fetch real user data
  const { users: allUsers, loading, error, refetch } = useUsers();
  
  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    if (!allUsers) return [];
    if (!searchTerm.trim()) return allUsers;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return allUsers.filter(user => 
      (user.name?.toLowerCase() || '').includes(searchLower) || 
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.username?.toLowerCase() || '').includes(searchLower)
    );
  }, [allUsers, searchTerm]);

  const navItems = [
    { type: 'link' as const, label: 'Inicio', to: '/' },
    { type: 'link' as const, label: 'Emprendimientos', to: '/feed/emprendimiento' },
    { type: 'link' as const, label: 'Ferias', to: '/ferias' },
  ];

  const logo = (
    <Link to="/" className="flex items-center">
      <img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />
    </Link>
  );

  const rightContent = (
    <Link
      to="/perfil"
      className="p-2 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-primary bg-gray-50"
      aria-label="Ir al perfil"
    >
      <Person sx={{ fontSize: 20 }} />
    </Link>
  );

  const handleActionClick = (userId: number) => {
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  const handleOptionClick = async (option: string, userId: number) => {
    try {
      let response;

      switch (option) {
        case 'Eliminar':
          response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
          break;
        case 'Habilitar':
        case 'Deshabilitar':
          const isBanning = option === 'Deshabilitar';
          response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banned: isBanning })
          });
          break;
        default:
          alert(`Opción: ${option} para usuario ID: ${userId}`);
          setOpenMenuId(null);
          return;
      }

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud');
      }

      // Refresh the user list
      refetch();
      setOpenMenuId(null);
      alert(`Usuario ${option.toLowerCase()} correctamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al procesar la solicitud');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        logo={logo}
        items={navItems}
        rightContent={rightContent}
        maxWidth="max-w-3xl"
      />
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
                <th className="py-3 px-2">Nombre de usuario</th>
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
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
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
                            to={`/editar-usuario/${user.id}`}
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
      </div>
    </div>
  );
};
