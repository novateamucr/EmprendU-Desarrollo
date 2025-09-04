import React from "react";
import logo from "../../assets/logo.svg";
import search from "../../assets/search.svg";
import logout from "../../assets/logout.svg";
import home from "../../assets/home.svg";

interface GestorProps{
  button?: React.ReactNode
}

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

const navigationItems = [
  {
    id: 1,
    label: "Inicio",
    active: false,
  },
  {
    id: 2,
    label: "Gestión de usuarios",
    active: true,
  },
  {
    id: 3,
    label: "Gestión de emprendimientos",
    active: false,
  },
];

export default function GestorUsuarios(props: GestorProps) {

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
    
    <div>
      <div className="w-[1920px] h-[1080px]">
        <header>
          <h1 className="absolute top-[46px] left-[412px] [font-family:'Kdam_Thmor-Regular',Helvetica] font-normal text-black text-[32px]">
            Gestión de usuarios
          </h1>
        </header>
        <div className="absolute w-[38px] h-[39px] top-[59px] left-[38px]">
          <img src={logo} className="absolute w-9 h-[38px] top-0 left-px" alt="EmprendU Logo"/>
          <h1 className=" absolute left-10 [font-family:'JaceBeleren-Bold',Helvetica] font-bold text-black text-xl ">EmprendU</h1>
        </div>
        
        <nav className="absolute left-10 top-[209px]">

            {navigationItems.map((item, index) => (
            <div key={item.id} className={`absolute w-[336px] h-9 bg-white 
                ${index === 0
                    ? "top-0"
                    : index === 1
                        ? "top-[56px]"
                        : "top-[112px]"
                }`}>
                <img
                  src={home}
                  className="absolute w-4 h-[17px] top-[9px] left-5"
                  alt=""
                />

                    <div className='absolute h-4 top-[9px] left-[54px] [font-family:Imprima-Regular,Helvetica] font-normal text-black text-sm text-center'>
                        {item.label}
                    </div>
                </div>
            ))}

            <button className="absolute w-[346px] h-9 top-[635px] left-[20px] bg-white hover:bg-gray-50 transition-colors">
                <img src={logout} className=" absolute" alt="logout"/>
                <p className="[font-family:'Imprima-Regular',Helvetica] font-normal text-[#646464] text-sm">Cerrar sesión</p>
            </button>

        </nav>

        <h3 className="absolute top-[165px] left-[421px] [font-family:'Kdam_Thmor-Regular',Helvetica] font-normal text-black text-2xl">Usuarios: {userData.length}</h3>

        <div className="absolute top-[230px] left-[414px]">
            <table className="w-[1440px] text-center border-gray-300">
                <thead>
                    <tr className="bg-[#f7f7f7]">
                        <th>Nombre de usuario</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Ultima modificación</th>
                        <th>Añadido en</th>
                        <th></th>
                    </tr>
                </thead>
                
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.type}</td>
                        <td>{user.status}</td>
                        <td>{user.lastModified}</td>
                        <td>{user.addedOn}</td>
                        <td >
                            <button onClick={() => handleActionClick(user.id)}>⋮</button>
                            {openMenuId === user.id && (
                            <div
                                className="absolute z-10 bg-white border border-gray-300 rounded shadow-md mt-2 right-0"
                                style={{ minWidth: "100px" }}
                            >
                                <button
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                onClick={() => handleOptionClick("Editar", user.id)}
                                >
                                Editar
                                </button>
                                <button
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                onClick={() => handleOptionClick("Eliminar", user.id)}
                                >
                                Eliminar
                                </button>
                                <button
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                onClick={() => handleOptionClick("Habilitar", user.id)}
                                >
                                Habilitar
                                </button>
                            </div>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>

        <div className="absolute w-[408px] h-[52px] top-[163px] left-[1207px] rounded-[40px] border-[3px] border-solid border-[#d9d9d9]">
          <input
            type="text"
            placeholder="Buscar"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="absolute top-0 left-[47px] w-[350px] h-[52px] [font-family:'Kdam_Thmor-Regular',Helvetica] font-normal text-[#9f9f9f] text-2xl bg-transparent"
          />
          <img src={search} className="absolute w-[29px] h-[29px] top-2 left-[5px]" alt="Search icon"/>
        </div>

        {props.button ? props.button : ""}

      </div>
    </div>
  );
};
