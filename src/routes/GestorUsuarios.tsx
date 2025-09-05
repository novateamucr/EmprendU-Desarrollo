import React from "react";
import { Navbar } from '../components/navbar';
import { Link } from "react-router-dom";
import {Person} from '@mui/icons-material';

const button = (
  <Link
    to="/añadir-usuario"
    className="bg-black text-white rounded-full px-6 py-3 text-base font-medium hover:opacity-90 transition-colors"
  >
    + Añadir usuario
  </Link>
);


const userData = [
  {
    id: 1,
    name: "Edward Waller Smith",
    type: "Admin",
    status: "Habilitado",
    lastModified: "Mar 22, 2026",
    addedOn: "Mar 22, 2026",
  },
  {
    id: 2,
    name: "Doreen Miranda Doe",
    type: "Emprendedor",
    status: "Deshabilitado",
    lastModified: "Mar 22, 2026",
    addedOn: "Mar 22, 2026",
  },
  {
    id: 3,
    name: "Amalia Leon Martines",
    type: "Usuario",
    status: "Habilitado",
    lastModified: "Mar 22, 2026",
    addedOn: "Mar 22, 2026",
  },
];



export default function GestorUsuarios() {
  const navItems = [
      { type: 'link' as const, label: 'Inicio', to: '/home' },
      { type: 'link' as const, label: 'Emprendimientos', to: '/feed/emprendimiento' },
      { type: 'link' as const, label: 'Ferias', to: '/ferias' },
    ];
  
    const logo = (
        <Link to="/home" className="flex items-center">
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

  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleActionClick = (userId: number) => {
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  const handleOptionClick = (option: string, userId: number) => {
    alert(`Opción: ${option} para usuario ID: ${userId}`);
    setOpenMenuId(null);
  };

  const filteredUsers = userData.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h3 className="text-lg font-medium text-secondary">Usuarios: {userData.length}</h3>
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
              {filteredUsers.map(user => (
                <tr key={user.id} className="relative">
                  <td>{user.name}</td>
                  <td>{user.type}</td>
                  <td>{user.status}</td>
                  <td>{user.lastModified}</td>
                  <td>{user.addedOn}</td>
                  <td className="relative">
                    <button onClick={() => handleActionClick(user.id)} className="px-2 py-1">⋮</button>
                    {openMenuId === user.id && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 bg-white min-w-[120px] shadow-lg border border-gray-200 rounded-md"
                      >
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={() => handleOptionClick("Editar", user.id)}
                        >Editar</button>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={() => handleOptionClick("Eliminar", user.id)}
                        >Eliminar</button>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={() => handleOptionClick("Habilitar", user.id)}
                        >Habilitar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
