  // Navbar items (required by Navbar component)
  const navItems: import("../components/navbar/types").NavbarItemConfig[] = [
    { type: 'link' as const, label: 'Inicio', to: '/home' },
    { type: 'link' as const, label: 'Emprendimientos', to: '/feed/emprendimiento' }
  ];
// No modal, use browser alerts for feedback
import { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { useUserRegistration } from '../hooks/useUserRegistration';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navbar';
import { useForm, useWatch } from 'react-hook-form';
import { TextField } from '../components/Form/TextField';

export function AñadirUsuario() {
  // Estado para mensajes de modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [onModalClose, setOnModalClose] = useState<(() => void) | null>(null);
  const navigate = useNavigate();
  const profileForm = useForm({
    defaultValues: {
      name: '',
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
  // Estados para datos de ubicación
  const [provincias, setProvincias] = useState<{ id: string, nombre: string }[]>([]);
  const [cantonesFiltrados, setCantonesFiltrados] = useState<{ id: string, nombre: string }[]>([]);
  const [distritosFiltrados, setDistritosFiltrados] = useState<{ id: string, nombre: string }[]>([]);
  const [provinciaId, setProvinciaId] = useState<string>('');
  // Observa los valores seleccionados
  const provinciaSeleccionada = useWatch({ control: profileForm.control, name: 'location.province' });
  const cantonSeleccionado = useWatch({ control: profileForm.control, name: 'location.canton' });
  // Cargar provincias al montar
  useEffect(() => {
    fetch('https://ubicaciones.paginasweb.cr/provincias.json')
      .then(res => res.json())
      .then(data => {
        const provs = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
        setProvincias(provs);
      });
  }, []);
  // Cuando cambia la provincia seleccionada, cargar cantones
  useEffect(() => {
    if (!provinciaSeleccionada) {
      setCantonesFiltrados([]);
      setDistritosFiltrados([]);
      setProvinciaId('');
      return;
    }
    const prov = provincias.find(p => p.nombre === provinciaSeleccionada);
    if (prov) {
      setProvinciaId(prov.id);
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${prov.id}/cantones.json`)
        .then(res => res.json())
        .then(data => {
          const cantones = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
          setCantonesFiltrados(cantones);
          setDistritosFiltrados([]);
        });
    } else {
      setCantonesFiltrados([]);
      setDistritosFiltrados([]);
      setProvinciaId('');
    }
  }, [provinciaSeleccionada, provincias]);
  // Cuando cambia el cantón seleccionado, cargar distritos
  useEffect(() => {
    if (!provinciaId || !cantonSeleccionado) {
      setDistritosFiltrados([]);
  //
      return;
    }
    const canton = cantonesFiltrados.find(c => c.nombre === cantonSeleccionado);
    if (canton) {
  //
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${provinciaId}/canton/${canton.id}/distritos.json`)
        .then(res => res.json())
        .then(data => {
          const distritos = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
          setDistritosFiltrados(distritos);
        });
    } else {
      setDistritosFiltrados([]);
  //
    }
  }, [provinciaId, cantonSeleccionado, cantonesFiltrados]);
  const { registerUser } = useUserRegistration();
  // Validación para solo números en teléfono
  profileForm.register('phone', {
    pattern: {
      value: /^[0-9]+$/,
      message: 'Solo se permiten números'
    }
  });

  const onSubmitProfile = async (data: any) => {
    // Validar contraseña antes de enviar
    if (!data.password || data.password.length < 6) {
      profileForm.setError('password', { type: 'manual', message: 'La contraseña es muy corta' });
      return;
    }
    let roleId = 1;
    if (data.role === 'emprendedor') roleId = 2;
    if (data.role === 'administrador') roleId = 3;
    const userData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: roleId,
      province: data.location?.province || '',
      canton: data.location?.canton || '',
      district: data.location?.district || '',
      address: data.location?.address || ''
    };
    try {
      const result = await registerUser(userData);
      if (result && result.token) {
        document.cookie = `auth_token=${result.token}; path=/; max-age=86400; secure; samesite=strict`;
        setModalTitle('Usuario creado');
        setModalMessage('¡Usuario creado exitosamente!');
        setOnModalClose(() => () => {
          setModalOpen(false);
          navigate('/gestor-usuarios');
        });
        setModalOpen(true);
        return;
      } else {
        setModalTitle('Error');
        setModalMessage('No se pudo crear el usuario.');
        setOnModalClose(() => () => setModalOpen(false));
        setModalOpen(true);
      }
    } catch (e) {
      setModalTitle('Error');
      setModalMessage('Ocurrió un error al crear el usuario.');
      setOnModalClose(() => () => setModalOpen(false));
      setModalOpen(true);
    }
  };
  const handleCancel = () => {
    navigate('/gestor-usuarios');
  };
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar items={navItems} maxWidth="max-w-3xl" />
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
                  <div>
                    <TextField
                      name="password"
                      label="Contraseña"
                      type="password"
                      register={profileForm.register}
                      error={profileForm.formState.errors?.password}
                      placeholder="Ingresa la contraseña"
                      required
                    />
                  </div>
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
                                {/* Selectores dependientes de provincia, cantón y distrito */}
                                <div>
                                  <label className="block text-sm font-medium text-primary mb-2">Provincia</label>
                                  <select
                                    {...profileForm.register('location.province', { required: true })}
                                    className="w-full px-4 py-2 border border-border rounded-lg text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={profileForm.watch('location.province')}
                                    onChange={e => {
                                      profileForm.setValue('location.province', e.target.value);
                                      profileForm.setValue('location.canton', '');
                                      profileForm.setValue('location.district', '');
                                    }}
                                  >
                                    <option value="">Seleccionar provincia</option>
                                    {provincias.map((prov) => (
                                      <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>
                                    ))}
                                  </select>
                                  {profileForm.formState.errors?.location?.province && (
                                    <span className="text-red-500 text-xs">Provincia requerida</span>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary mb-2">Cantón</label>
                                  <select
                                    {...profileForm.register('location.canton', { required: true })}
                                    className="w-full px-4 py-2 border border-border rounded-lg text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={profileForm.watch('location.canton')}
                                    onChange={e => {
                                      profileForm.setValue('location.canton', e.target.value);
                                      profileForm.setValue('location.district', '');
                                    }}
                                    disabled={!profileForm.watch('location.province')}
                                  >
                                    <option value="">Seleccionar cantón</option>
                                    {cantonesFiltrados.map((canton) => (
                                      <option key={canton.id} value={canton.nombre}>{canton.nombre}</option>
                                    ))}
                                  </select>
                                  {profileForm.formState.errors?.location?.canton && (
                                    <span className="text-red-500 text-xs">Cantón requerido</span>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary mb-2">Distrito</label>
                                  <select
                                    {...profileForm.register('location.district', { required: true })}
                                    className="w-full px-4 py-2 border border-border rounded-lg text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={profileForm.watch('location.district')}
                                    onChange={e => profileForm.setValue('location.district', e.target.value)}
                                    disabled={!profileForm.watch('location.canton')}
                                  >
                                    <option value="">Seleccionar distrito</option>
                                    {distritosFiltrados.map((distrito) => (
                                      <option key={distrito.id} value={distrito.nombre}>{distrito.nombre}</option>
                                    ))}
                                  </select>
                                  {profileForm.formState.errors?.location?.district && (
                                    <span className="text-red-500 text-xs">Distrito requerido</span>
                                  )}
                                </div>
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
                  {/* Modal para mensajes de éxito o error */}
                  <Modal isOpen={modalOpen} onClose={() => {
                    setModalOpen(false);
                    if (onModalClose) onModalClose();
                  }} title={modalTitle}>
                    <div className="text-center">
                      <p>{modalMessage}</p>
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => {
                            setModalOpen(false);
                            if (onModalClose) onModalClose();
                          }}
                          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                          Aceptar
                        </button>
                      </div>
                    </div>
                  </Modal>
                </div>
              );
}