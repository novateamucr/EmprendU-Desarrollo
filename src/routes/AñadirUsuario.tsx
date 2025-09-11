import { useUserRegistration } from '../hooks/useUserRegistration';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navbar';
import { useForm } from 'react-hook-form';
import { TextField } from '../components/Form/TextField';
import { Link } from "react-router-dom";
import {Person} from '@mui/icons-material';

export function AñadirUsuario() {
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

  const navigate = useNavigate();


    const profileForm = useForm({
      defaultValues: {
        name: '',
        username: '',
        role: 'comprador',
        email: '',
        phone: '',
        location: {
          province: '',
          canton: '',
          district: '',
          address: ''
        },
        password: ''
      }
    });

    // Placeholder for add user API

  const { registerUser, error } = useUserRegistration();

    const onSubmitProfile = async (data: any) => {
      // Mapear el tipo de cuenta a role ID (asumiendo: comprador = 1, emprendedor = 2, administrador = 3)
      let roleId = 1;
      if (data.role === 'emprendedor') roleId = 2;
      if (data.role === 'administrador') roleId = 3;
      const userData = {
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        location: data.location,
        password: data.password,
        role: roleId,
      };
      const result = await registerUser(userData);
      if (result) {
        if (result.token) {
          document.cookie = `auth_token=${result.token}; path=/; max-age=86400; secure; samesite=strict`;
        }
        navigate('/gestor-usuarios');
      } else if (error) {
        alert(`Error: ${error}`);
      }
    };

    const handleCancel = () => {
      navigate('/gestor-usuarios');
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
          <div className="flex justify-center">
            <div className="w-full max-w-3xl mt-6">
              <div className="bg-white rounded-card shadow-soft border border-border p-6">
                <h1 className="text-2xl font-semibold text-primary mb-8">Añadir Usuario</h1>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <TextField
                      name="name"
                      label="Nombre completo"
                      register={profileForm.register}
                      error={profileForm.formState.errors?.name}
                      placeholder="Ingresa el nombre completo"
                      required
                    />
                    <TextField
                      name="username"
                      label="Nombre de usuario"
                      register={profileForm.register}
                      error={profileForm.formState.errors?.username}
                      placeholder="Ingresa el nombre de usuario"
                      required
                    />
                    <TextField
                      name="email"
                      label="Correo electrónico"
                      type="email"
                      register={profileForm.register}
                      error={profileForm.formState.errors?.email}
                      placeholder="Ingresa el email"
                      required
                    />
                    <TextField
                      name="phone"
                      label="Teléfono"
                      type="tel"
                      register={profileForm.register}
                      error={profileForm.formState.errors?.phone}
                      placeholder="Ingresa el teléfono"
                    />
                    <TextField
                      name="password"
                      label="Contraseña"
                      type="password"
                      register={profileForm.register}
                      error={profileForm.formState.errors?.password}
                      placeholder="Ingresa la contraseña"
                      required
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-primary mb-2">Rol</label>
                      <select
                        {...profileForm.register('role')}
                        className="w-full px-4 py-2 border border-border rounded-lg text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="comprador">Comprador</option>
                        <option value="emprendedor">Emprendedor</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <TextField
                        name="location.province"
                        label="Provincia"
                        register={profileForm.register}
                        error={profileForm.formState.errors?.location?.province}
                        placeholder="Seleccionar provincia"
                      />
                      <TextField
                        name="location.canton"
                        label="Cantón"
                        register={profileForm.register}
                        error={profileForm.formState.errors?.location?.canton}
                        placeholder="Seleccionar cantón"
                      />
                      <TextField
                        name="location.district"
                        label="Distrito"
                        register={profileForm.register}
                        error={profileForm.formState.errors?.location?.district}
                        placeholder="Seleccionar distrito"
                      />
                    </div>
                    <TextField
                      name="location.address"
                      label="Dirección breve"
                      register={profileForm.register}
                      error={profileForm.formState.errors?.location?.address}
                      placeholder="Ej: 200m norte del parque central"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 border border-border text-secondary rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      Crear usuario
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
  {/* Ubicación y modal eliminados */}
      </div>
    );
  }
