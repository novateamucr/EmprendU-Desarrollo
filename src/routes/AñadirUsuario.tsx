import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navbar';
import { useState } from 'react';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RoleSelector } from '../components/RoleSelector';
import { Modal } from '../components/Modal';
import { TextField } from '../components/Form/TextField';
import { SelectField } from '../components/Form/SelectField';
import { useLocations } from '../hooks/useLocations';
import { profileFormSchema } from '../domain/profile/schema';
import type { ProfileFormData } from '../domain/profile/schema';
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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { provincias, cantones, distritos, loadCantones, loadDistritos } = useLocations();

    const profileForm = useForm<ProfileFormData>({
      resolver: zodResolver(profileFormSchema),
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
        }
      }
    });

    // Placeholder for add user API
    const onSubmitProfile = (data: ProfileFormData) => {
      alert('Usuario creado: ' + JSON.stringify(data, null, 2));
      navigate('/gestor-usuarios');
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
                      error={profileForm.formState.errors.name}
                      placeholder="Ingresa el nombre completo"
                      required
                    />
                    <TextField
                      name="username"
                      label="Nombre de usuario"
                      register={profileForm.register}
                      error={profileForm.formState.errors.username}
                      placeholder="Ingresa el nombre de usuario"
                      required
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-primary mb-2">Rol</label>
                      <RoleSelector
                        value={profileForm.watch('role')}
                        onChange={(role) => profileForm.setValue('role', role)}
                      />
                    </div>
                    <TextField
                      name="phone"
                      label="Teléfono"
                      type="tel"
                      register={profileForm.register}
                      error={profileForm.formState.errors.phone}
                      placeholder="Ingresa el teléfono"
                    />
                    <TextField
                      name="email"
                      label="Correo electrónico"
                      type="email"
                      register={profileForm.register}
                      error={profileForm.formState.errors.email}
                      placeholder="Ingresa el email"
                      required
                    />
                  </div>
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold text-primary">Ubicación</h3>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Información sobre ubicación"
                      >
                        <Info className="w-4 h-4 text-secondary" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <SelectField
                        name="location.province"
                        label="Provincia"
                        register={profileForm.register}
                        error={profileForm.formState.errors.location?.province}
                        options={provincias.map(p => ({ value: p.nombre, label: p.nombre }))}
                        placeholder="Seleccionar provincia"
                        onChange={(value) => {
                          profileForm.setValue('location.canton', '');
                          profileForm.setValue('location.district', '');
                          loadCantones(value);
                        }}
                      />
                      <SelectField
                        name="location.canton"
                        label="Cantón"
                        register={profileForm.register}
                        error={profileForm.formState.errors.location?.canton}
                        options={cantones.map(c => ({ value: c.nombre, label: c.nombre }))}
                        placeholder="Seleccionar cantón"
                        disabled={!profileForm.watch('location.province')}
                        onChange={(value) => {
                          profileForm.setValue('location.district', '');
                          const province = profileForm.watch('location.province');
                          if (province) {
                            loadDistritos(province, value);
                          }
                        }}
                      />
                      <SelectField
                        name="location.district"
                        label="Distrito"
                        register={profileForm.register}
                        error={profileForm.formState.errors.location?.district}
                        options={distritos.map(d => ({ value: d.nombre, label: d.nombre }))}
                        placeholder="Seleccionar distrito"
                        disabled={!profileForm.watch('location.canton')}
                      />
                    </div>
                    <TextField
                      name="location.address"
                      label="Dirección breve"
                      register={profileForm.register}
                      error={profileForm.formState.errors.location?.address}
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
        <Modal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          title="Sobre tu ubicación"
        >
          <div className="space-y-4 text-sm text-secondary">
            <p>
              Tu ubicación nos ayuda a conectarte con emprendimientos cercanos y eventos locales en tu área.
            </p>
            <p>
              La información de ubicación es opcional y puedes elegir qué tan específica quieres que sea. Solo se muestra tu provincia y cantón a otros usuarios.
            </p>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
