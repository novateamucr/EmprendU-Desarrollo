import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Info, Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navbar } from '../components/navbar';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RoleSelector } from '../components/RoleSelector';
import { Modal } from '../components/Modal';
import { TextField } from '../components/Form/TextField';
import { ImageUpload } from '../components/ImageUpload';
import { useProfile, useProfileById, useUpdateProfile, useUpdatePassword, useUploadAvatar, useUpdateProfileById, useUploadAvatarById, useAdminResetPasswordById } from '../domain/profile/queries';
import { profileFormSchema, passwordSchema, adminPasswordSchema } from '../domain/profile/schema';
import type { ProfileFormData, PasswordFormData, AdminPasswordFormData } from '../domain/profile/schema';
import { getProfile } from '../domain/profile/service';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
// TODO: reactivar cuando el equipo de auth dé el flujo final
// import { getToken } from '../domain/auth';

export function EditarPerfil() {
  const navigate = useNavigate();
  const { token, login, logout } = useAuth();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  
  const isEditingOther = !!id;
  const { data: user, isLoading, isError, error, refetch } = (isEditingOther ? useProfileById(id as string) : useProfile()) as any;
  const updateProfileMutation = isEditingOther ? useUpdateProfileById(id as string) : useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();
  const uploadAvatarMutation = isEditingOther ? useUploadAvatarById(id as string) : useUploadAvatar();
  const adminResetPasswordMutation = isEditingOther ? useAdminResetPasswordById(id as string) : null;

  // Estados y efectos para ubicación usando la misma API que AñadirUsuario
  const [provincias, setProvincias] = useState<{ id: string, nombre: string }[]>([]);
  const [cantonesFiltrados, setCantonesFiltrados] = useState<{ id: string, nombre: string }[]>([]);
  const [distritosFiltrados, setDistritosFiltrados] = useState<{ id: string, nombre: string }[]>([]);
  const [provinciaId, setProvinciaId] = useState<string>('');

  // (watchers y efectos se declaran después de crear profileForm)

  // Estado para el rol anterior
  const [, setPreviousRole] = useState<string | null>(null);
  const [showRoleChangeWarning, setShowRoleChangeWarning] = useState(false);

  // Helper para mapear role numérico a string
  const mapRole = (role: any): 'comprador' | 'emprendedor' | 'administrador' => {
    if (role === 'administrador' || role === 3) return 'administrador';
    if (role === 'emprendedor' || role === 2) return 'emprendedor';
    return 'comprador';
  };

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: user ? {
      name: user.name,
      role: mapRole(user.role),
      email: user.email,
      phone: user.phone || '',
      location: {
        province: user.location?.province || '',
        canton: user.location?.canton || '',
        district: user.location?.district || '',
        address: user.location?.address || ''
      }
    } : undefined
  });

  // Register 'role' field so setValue(..., { shouldDirty: true }) updates isDirty
  useEffect(() => {
    profileForm.register('role');
  }, []);

  // Watchers de ubicación (después de crear profileForm)
  const provinciaSeleccionada = useWatch({ control: profileForm.control, name: 'location.province' as any });
  const cantonSeleccionado = useWatch({ control: profileForm.control, name: 'location.canton' as any });

  // Cargar provincias al montar
  useEffect(() => {
    fetch('https://ubicaciones.paginasweb.cr/provincias.json')
      .then(res => res.json())
      .then(data => {
        const provs = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
        setProvincias(provs);
      });
  }, []);

  // Cuando cambia la provincia, cargar cantones
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

  // Cuando cambia el cantón, cargar distritos
  useEffect(() => {
    if (!provinciaId || !cantonSeleccionado) {
      setDistritosFiltrados([]);
      return;
    }
    const canton = cantonesFiltrados.find(c => c.nombre === cantonSeleccionado);
    if (canton) {
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${provinciaId}/canton/${canton.id}/distritos.json`)
        .then(res => res.json())
        .then(data => {
          const distritos = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
          setDistritosFiltrados(distritos);
        });
    } else {
      setDistritosFiltrados([]);
    }
  }, [provinciaId, cantonSeleccionado, cantonesFiltrados]);

  // Helper: target being edited is admin (role 3)
  const isTargetAdmin = isEditingOther && user?.role === 'administrador';

  // Helpers: generate strong password and copy to clipboard
  const generateStrongPassword = () => {
    const length = 14;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>?';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return pass;
  };

  const handleGenerateAdminPassword = () => {
    const p = generateStrongPassword();
    adminPasswordForm.setValue('password', p, { shouldDirty: true });
    adminPasswordForm.setValue('password_confirmation', p, { shouldDirty: true });
    setGeneratedAdminPassword(p);
  };

  

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: ''
    }
  });

  // Formulario de restablecimiento de contraseña para admin (sin contraseña actual)
  const [showAdminPasswordForm, setShowAdminPasswordForm] = useState(false);
  const [showAdminPasswordSuccess, setShowAdminPasswordSuccess] = useState(false);
  const [generatedAdminPassword, setGeneratedAdminPassword] = useState<string | null>(null);
  const [showGeneratedVisible, setShowGeneratedVisible] = useState(false);
  const adminPasswordForm = useForm<AdminPasswordFormData>({
    resolver: zodResolver(adminPasswordSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      password_confirmation: ''
    }
  });

  // Inicializar el rol anterior cuando se carga el usuario
  useEffect(() => {
    if (user?.role) {
      setPreviousRole(user.role);
    }
  }, [user?.role]);

  // Prefill del formulario: ejecutar una sola vez por usuario (evita loops)
  const lastPrefilledUserIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    if (lastPrefilledUserIdRef.current === user.id) return;

    // Reset de valores del formulario para asegurar prellenado correcto
    profileForm.reset({
      name: user.name,
      role: mapRole(user.role),
      email: user.email,
      phone: user.phone || '',
      location: {
        province: user.location?.province || '',
        canton: user.location?.canton || '',
        district: user.location?.district || '',
        address: user.location?.address || ''
      }
    });

    lastPrefilledUserIdRef.current = user.id;
  }, [user?.id]);

  // Enviar perfil
  const onSubmitProfile = (data: ProfileFormData) => {
    // Merge with current form values to be sure 'role' and nested fields are present
    const current = profileForm.getValues();
    const merged = { ...current, ...data } as ProfileFormData;

    // If target is admin, force role to remain as 'administrador'
    const safeData = { ...merged };
    if (isTargetAdmin) {
      safeData.role = 'administrador' as any;
    }

    updateProfileMutation.mutate(safeData, {
      onSuccess: async () => {
        // Bandera para celebrar en Perfil solo para self-edit
        if (!isEditingOther) {
          localStorage.setItem('celebrate', 'profile_saved');
          try {
            // Recargar la sesión con los datos actualizados
            const updated = await getProfile();
            if (token && updated) {
              // Adaptar a la forma esperada por AuthContext
              const mappedUser = {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                role: typeof updated.role === 'number' ? updated.role : 1,
                phone: updated.phone,
                province: updated.province,
                canton: updated.canton,
                district: updated.district,
                address: updated.address,
                avatar_url: (updated as any).avatar_url,
                created_at: '',
                updated_at: '',
                role_relation: updated.roleRelation ? { id: updated.roleRelation.id, name: updated.roleRelation.name } : null,
                interests: Array.isArray(updated.interests) ? updated.interests : [],
                entrepreneurships: Array.isArray(updated.entrepreneurships) ? updated.entrepreneurships : []
              } as any;
              // Re-login para actualizar contexto y localStorage
              login({ token, user: mappedUser });
            }
          } catch (_) {
            // En caso de falla, continuar navegación igualmente
          }
          navigate('/profile');
        } else {
          navigate('/admin/usuarios');
        }
      }
    });
  };

  // Auto-ocultar el banner de éxito a los 3s y cerrar la sección
  useEffect(() => {
    if (!showPasswordSuccess) return;
    const t = setTimeout(() => {
      setShowPasswordSuccess(false);
      setShowPasswordForm(false); // cerrar la sección automáticamente
    }, 3000);
    return () => clearTimeout(t);
  }, [showPasswordSuccess]);

  // Enviar cambio de contraseña
  const onSubmitPassword = (data: PasswordFormData) => {
    updatePasswordMutation.mutate(data, {
      onSuccess: () => {
        passwordForm.clearErrors();
        passwordForm.reset();
        // Mantener visible la sección para mostrar el aviso de éxito
        setShowPasswordSuccess(true);
      },
      onError: (err: any) => {
        const status = err?.response?.status;
        const message: string = err?.response?.data?.message || err?.message || 'Error al actualizar la contraseña.';
        if (status === 422 || String(message).includes('422')) {
          // Mostrar mensaje claro en el campo
          passwordForm.setError('current_password', { type: 'server', message: 'Contraseña incorrecta' });
          return;
        }
      }
    });
  };

  // Enviar restablecimiento de contraseña por admin
  const onSubmitAdminPassword = (data: AdminPasswordFormData) => {
    if (!adminResetPasswordMutation) return;
    adminResetPasswordMutation.mutate(data, {
      onSuccess: () => {
        adminPasswordForm.clearErrors();
        adminPasswordForm.reset();
        setShowAdminPasswordSuccess(true);
        setTimeout(() => setShowAdminPasswordSuccess(false), 3000);
        // Clear generated password after saving so it's no longer available
        setGeneratedAdminPassword(null);
      }
    });
  };

  const handleCancel = () => {
    if (isEditingOther) {
      navigate('/admin/usuarios');
    } else {
      navigate('/profile');
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeletePending(true);
    try {
      await api.delete(`/users/${user.id}`);
      if (typeof logout === 'function') {
        try { logout(); } catch (_) { /* ignore */ }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      queryClient.clear();
      navigate('/login');
    } catch (err: any) {
      console.error('Error eliminando cuenta:', err);
      alert(err?.response?.data?.message || 'No se pudo eliminar la cuenta');
    } finally {
      setDeletePending(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar
          logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
          maxWidth="max-w-2xl"
          items={[
            { type: 'link', label: 'Inicio', to: '/home' },
            { type: 'link', label: 'Emprendimientos', to: '/feed/emprendimiento' },
            { type: 'link', label: 'Ferias', to: '/ferias' },
          ]}
          rightContent={
            <Link
              to="/profile"
              className="p-2 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-primary bg-gray-50"
              aria-label="Ir al perfil"
            >
              <User className="w-5 h-5" />
            </Link>
          }
        />
        <div className="pt-20 px-4 max-w-4xl mx-auto">
          <div className="py-12">
            <div className="rounded-xl border border-border p-4 bg-white shadow-sm">
              <p className="text-red-600 font-medium">Error al cargar el perfil</p>
              <button onClick={() => refetch()} className="mt-2 px-4 py-2 rounded-lg border border-border hover:bg-brand/10 hover:text-brand transition-colors focus-brand">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-backgroundDark">
      <Navbar
        logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
        maxWidth="max-w-2xl"
        items={[
          { type: 'link', label: 'Inicio', to: '/home' },
          { type: 'link', label: 'Emprendimientos', to: '/feed/emprendimiento' },
          { type: 'link', label: 'Ferias', to: '/ferias' },
        ]}
        rightContent={
          <Link
            to="/profile"
            className="p-2 rounded-full transition-colors hover:bg-brand/10 focus-brand text-primary bg-brand/5 dark:bg-cardDark dark:text-white"
            aria-label="Ir al perfil"
          >
            <User className="w-5 h-5" />
          </Link>
        }
      />
      
      <div className="pt-20 px-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        <div className="flex justify-center">
          {/* Formulario principal */}
          <div className="w-full max-w-3xl mt-6">
            <div className="bg-white rounded-card shadow-soft border border-border p-6 dark:bg-cardDark dark:border-cardDark">
              <h1 className="text-2xl font-semibold text-primary dark:text-white mb-8">{isEditingOther ? `Editar Perfil: ${user?.name ?? ''}` : 'Editar Perfil'}</h1>

              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                {/* Avatar */}
                <div className="flex justify-center mb-8">
                  <ImageUpload
                    currentImage={user.avatarUrl}
                    placeholderInitial={(user.name || user.email || 'U').trim().charAt(0).toUpperCase()}
                    onImageChange={(imageData) => {
                      uploadAvatarMutation.mutate(imageData);
                    }}
                  />
                </div>

                {/* Información básica */}
                <div className="grid grid-cols-1  gap-6 mb-8">
                  <TextField
                    name="name"
                    label="Nombre completo"
                    register={profileForm.register}
                    error={profileForm.formState.errors.name}
                    placeholder="Ingresa tu nombre completo"
                    required
                  />

                  

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-primary dark:text-white mb-2">
                      Rol
                    </label>
                    <RoleSelector
                      value={profileForm.watch('role')}
                      onChange={(role) => {
                        // Block changing role for admin users being edited
                        if (isTargetAdmin && role !== 'administrador') {
                          return;
                        }
                        profileForm.setValue('role', role, { shouldDirty: true, shouldValidate: true });
                      }}
                      onRoleChangeWarning={isEditingOther ? undefined : ((fromRole, toRole) => {
                        if (fromRole === 'emprendedor' && toRole === 'comprador') {
                          setShowRoleChangeWarning(true);
                        }
                      })}
                      suppressWarnings={isEditingOther}
                      showAdminOption={isEditingOther}
                    />
                    {isTargetAdmin && (
                      <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                        Este usuario tiene rol Administrador (3). Por seguridad, no se puede cambiar su rol desde esta pantalla.
                      </p>
                    )}
                  </div>

                  <TextField
                    name="phone"
                    label="Teléfono"
                    type="tel"
                    register={profileForm.register}
                    error={profileForm.formState.errors.phone}
                    placeholder="Ingresa tu teléfono"
                  />

                  <TextField
                    name="email"
                    label="Correo electrónico"
                    type="email"
                    register={profileForm.register}
                    error={profileForm.formState.errors.email}
                    placeholder="Ingresa tu email"
                    required
                  />
                </div>

              {/* Ubicación */}
              <div className="mb-8">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-primary dark:text-white">Ubicación</h3>
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="p-1 hover:bg-brand/10 rounded-full transition-colors focus-brand"
                      aria-label="Información sobre ubicación"
                    >
                    <Info className="w-4 h-4 text-secondary" />
                    </button>
                  </div>
                  <div className="mt-2 h-0.5 w-16 bg-brand/40 rounded"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-primary dark:text-white mb-2">Provincia</label>
                    <select
                      {...profileForm.register('location.province', { required: true })}
                      className="w-full px-4 py-2 border border-border rounded-lg text-base text-cardDark focus:outline-none focus:ring-2 focus:ring-brand dark:border-cardDark dark:bg-backgroundDark dark:text-secondaryDark"
                      value={profileForm.watch('location.province')}
                      onChange={e => {
                        profileForm.setValue('location.province', e.target.value, { shouldDirty: true });
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
                    <label className="block text-sm font-medium text-primary dark:text-white mb-2">Cantón</label>
                    <select
                      {...profileForm.register('location.canton', { required: true })}
                      className="w-full px-4 py-2 border border-border rounded-lg text-base text-cardDark focus:outline-none focus:ring-2 focus:ring-brand dark:border-cardDark dark:bg-backgroundDark dark:text-secondaryDark"
                      value={profileForm.watch('location.canton')}
                      onChange={e => {
                        profileForm.setValue('location.canton', e.target.value, { shouldDirty: true });
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
                    <label className="block text-sm font-medium text-primary dark:text-white mb-2">Distrito</label>
                    <select
                      {...profileForm.register('location.district', { required: true })}
                      className="w-full px-4 py-2 border border-border rounded-lg text-base text-secondary focus:outline-none focus:ring-2 focus:ring-brand dark:border-cardDark dark:bg-backgroundDark dark:text-secondaryDark"
                      value={profileForm.watch('location.district')}
                      onChange={e => profileForm.setValue('location.district', e.target.value, { shouldDirty: true })}
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
                  error={profileForm.formState.errors.location?.address}
                  placeholder="Ej: 200m norte del parque central"
                />
              </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-border text-secondary rounded-lg font-medium hover:bg-brandDark hover:text-brand transition-colors focus-brand dark:border-cardDark dark:text-secondaryDark dark:hover:bg-cardDark"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                    title={!profileForm.formState.isDirty ? 'No hay cambios por guardar' : undefined}
                    className="px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus-brand dark:bg-brandDark dark:hover:bg-brand"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cambios
                  </button>
                </div>
              </form>

              {/* Contraseña: solo visible cuando el usuario edita su propia cuenta */}
              {!isEditingOther && (
              <div className="mt-8 pt-8 border-t border-border dark:border-backgroundDark">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary dark:text-white">Contraseña</h3>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 text-sm bg-brand/10 text-secondary rounded-lg hover:bg-brand/20 transition-colors focus-brand dark:text-secondaryDark dark:hover:bg-cardDark"
                  >
                    {showPasswordForm ? 'Cancelar' : 'Cambiar contraseña'}
                  </button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextField
                        name="current_password"
                        label="Contraseña actual"
                        type="password"
                        register={passwordForm.register}
                        placeholder="••••••••"
                        required
                      />

                      <TextField
                        name="password"
                        label="Nueva contraseña"
                        type="password"
                        register={passwordForm.register}
                        error={passwordForm.formState.errors.password}
                        placeholder="••••••••"
                        required
                      />

                      <TextField
                        name="password_confirmation"
                        label="Confirmar contraseña"
                        type="password"
                        register={passwordForm.register}
                        error={passwordForm.formState.errors.password_confirmation}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    {/* Mensajes de estado */}
                    <div aria-live="polite" className="space-y-2">
                      {showPasswordSuccess && (
                        <div className="text-green-700 bg-green-50 border border-green-200 rounded p-2 text-sm">
                          Contraseña actualizada correctamente.
                        </div>
                      )}

                      {updatePasswordMutation.isError && (() => {
                        const err: any = updatePasswordMutation.error;
                        const status = err?.response?.status;
                        const message = err?.response?.data?.message || err?.message;
                        if (status === 422 || String(message).includes('422')) {
                          return (
                            <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
                              Contraseña incorrecta
                            </div>
                          );
                        }
                        return (
                          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
                            {message || 'Error al actualizar la contraseña.'}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={updatePasswordMutation.isPending}
                        className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark dark:bg-brandDark dark:hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus-brand"
                      >
                        {updatePasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Actualizar contraseña
                      </button>
                    </div>
                  </form>
                )}
              </div>
              )}
              {/* Restablecer contraseña (admin editando a otro usuario) */}
              {isEditingOther && (
              <div className="mt-8 pt-8 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">Restablecer contraseña</h3>
                  <button
                    type="button"
                    onClick={() => setShowAdminPasswordForm(!showAdminPasswordForm)}
                    className="px-4 py-2 text-sm bg-brand/10 text-secondary rounded-lg hover:bg-brand/20 transition-colors focus-brand"
                  >
                    {showAdminPasswordForm ? 'Cancelar' : 'Restablecer contraseña'}
                  </button>
                </div>

                {showAdminPasswordForm && (
                  <form onSubmit={adminPasswordForm.handleSubmit(onSubmitAdminPassword)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextField
                        name="password"
                        label="Nueva contraseña"
                        type="password"
                        register={adminPasswordForm.register}
                        error={adminPasswordForm.formState.errors.password}
                        placeholder="••••••••"
                        required
                      />

                      <TextField
                        name="password_confirmation"
                        label="Confirmar contraseña"
                        type="password"
                        register={adminPasswordForm.register}
                        error={adminPasswordForm.formState.errors.password_confirmation}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div aria-live="polite" className="space-y-2">
                      {showAdminPasswordSuccess && (
                        <div className="text-green-700 bg-green-50 border border-green-200 rounded p-2 text-sm">
                          Contraseña restablecida correctamente.
                        </div>
                      )}
                      {adminResetPasswordMutation?.isError && (
                        <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
                          {(adminResetPasswordMutation.error as any)?.message || 'Error al restablecer la contraseña.'}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateAdminPassword}
                          className="px-3 py-1 text-sm bg-brand/10 text-secondary rounded hover:bg-brand/20 focus-brand"
                        >
                          Generar contraseña
                        </button>
                      </div>
                      {generatedAdminPassword && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type={showGeneratedVisible ? 'text' : 'password'}
                            readOnly
                            value={generatedAdminPassword}
                            className="w-full md:w-auto px-3 py-2 border border-border rounded text-sm"
                            aria-label="Contraseña generada"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGeneratedVisible(v => !v)}
                            className="px-3 py-1 text-sm bg-brand/10 text-secondary rounded hover:bg-brand/20 focus-brand"
                            aria-label={showGeneratedVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showGeneratedVisible ? 'Ocultar' : 'Mostrar'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={adminResetPasswordMutation?.isPending}
                        className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus-brand"
                      >
                        {adminResetPasswordMutation?.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar nueva contraseña
                      </button>
                    </div>
                  </form>
                )}
              </div>
              )}

              {/* Eliminar cuenta: solo visible cuando el usuario edita su propia cuenta */}
              {!isEditingOther && (
                <div className="mt-8 pt-8 border-t border-border dark:border-backgroundDark">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-red-600">Eliminar cuenta</h3>
                    <p className="text-sm text-secondary mt-2">
                      Esta acción eliminará tu cuenta de forma permanente y no se podrá deshacer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus-brand"
                  >
                    Eliminar mi cuenta
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal confirmar eliminar cuenta */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar cuenta"
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Esta acción eliminará tu cuenta de forma permanente y no se podrá deshacer. ¿Deseas continuar?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={deleteAccount}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              disabled={deletePending}
            >
              {deletePending ? 'Eliminando...' : 'Eliminar cuenta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Información de Ubicación */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title="Sobre tu ubicación"
      >
        <div className="space-y-4 text-sm text-secondary">
          <p>
            Tu ubicación nos ayuda a conectarte con emprendimientos cercanos 
            y eventos locales en tu área.
          </p>
          <p>
            La información de ubicación es opcional y puedes elegir qué tan 
            específica quieres que sea. Solo se muestra tu provincia y cantón 
            a otros usuarios.
          </p>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowLocationModal(false)}
              className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors focus-brand"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de advertencia de cambio de rol */}
      <Modal
        isOpen={showRoleChangeWarning}
        onClose={() => setShowRoleChangeWarning(false)}
        title="Cambio de rol a Comprador"
      >
        <div className="space-y-4 text-sm text-secondary">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="font-medium text-yellow-800 mb-2">
              ⚠️ Importante: Cambio de Emprendedor a Comprador
            </p>
            <p className="text-yellow-700">
              Al cambiar a comprador, sus emprendimientos quedarán temporalmente desactivados 
              (no se borrarán) mientras esté en estado de comprador.
            </p>
          </div>
          
          <p>
            <strong>Recuerde:</strong> Podrá seguir comprando aunque sea emprendedor. 
            La condición de emprendedor será visible para los emprendimientos a los que compre.
          </p>
          
          <p className="text-xs text-gray-500">
            Puede cambiar de rol en cualquier momento desde su perfil.
          </p>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowRoleChangeWarning(false)}
              className="px-4 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                profileForm.setValue('role', 'comprador', { shouldDirty: true, shouldValidate: true });
                setShowRoleChangeWarning(false);
              }}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              Confirmar cambio
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}