import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navbar } from '../components/Navbar';
import { RoleSelector } from '../components/RoleSelector';
import { Modal } from '../components/Modal';
import { TextField } from '../components/Form/TextField';
import { SelectField } from '../components/Form/SelectField';
import { ImageUpload } from '../components/ImageUpload';
import { useProfile, useUpdateProfile, useUpdatePassword, useUploadAvatar } from '../domain/profile/queries';
import { useLocations } from '../hooks/useLocations';
import { profileFormSchema, passwordSchema } from '../domain/profile/schema';
import type { ProfileFormData, PasswordFormData } from '../domain/profile/schema';
import { getToken } from '../domain/auth';
import { ErrorMustLogin, ErrorSessionExpired, ErrorSystem, ErrorDB } from '../components/ErrorStates';

export function EditarPerfil() {
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const { data: user, isLoading, isError, error, refetch } = useProfile() as any;
  const hasCreds = !!getToken();
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();
  const uploadAvatarMutation = useUploadAvatar();
  const { provincias, cantones, distritos, loadCantones, loadDistritos } = useLocations();

  // Estado para el rol anterior
  const [, setPreviousRole] = useState<string | null>(null);
  const [showRoleChangeWarning, setShowRoleChangeWarning] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: user ? {
      name: user.name,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone || '',
      location: {
        province: user.location.province || '',
        canton: user.location.canton || '',
        district: user.location.district || '',
        address: user.location.address || ''
      }
    } : undefined
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
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

  const onSubmitProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        navigate('/perfil');
      }
    });
  };

  const onSubmitPassword = (data: PasswordFormData) => {
    updatePasswordMutation.mutate(data, {
      onSuccess: () => {
        passwordForm.reset();
        setShowPasswordForm(false);
      }
    });
  };

  const handleCancel = () => {
    navigate('/perfil');
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
        <Navbar maxWidth="max-w-2xl" />
        <div className="pt-20 px-4 max-w-4xl mx-auto">
          <div className="py-12">
            {!hasCreds ? (
              <ErrorMustLogin onLogin={() => { window.location.href = '/login'; }} />
            ) : error.kind === 'unauth' ? (
              <ErrorSessionExpired onLogin={() => { window.location.href = '/login'; }} />
            ) : error.kind === 'notfound' ? (
              <ErrorSystem onRetry={() => refetch()} />
            ) : error.kind === 'server' || error.kind === 'network' ? (
              <ErrorDB onRetry={() => refetch()} />
            ) : (
              <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                <p className="text-red-600 font-medium">Error al cargar el perfil</p>
                <button onClick={() => refetch()} className="mt-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar maxWidth="max-w-2xl" />
      
      <div className="pt-20 px-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        <div className="flex justify-center">
          {/* Formulario principal */}
          <div className="w-full max-w-3xl mt-6">
            <div className="bg-white rounded-card shadow-soft border border-border p-6">
              <h1 className="text-2xl font-semibold text-primary mb-8">Editar Perfil</h1>

              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                {/* Avatar */}
                <div className="flex justify-center mb-8">
                  <ImageUpload
                    currentImage={user.avatarUrl}
                    onImageChange={(imageData) => {
                      uploadAvatarMutation.mutate(imageData);
                    }}
                  />
                </div>

                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <TextField
                    name="name"
                    label="Nombre completo"
                    register={profileForm.register}
                    error={profileForm.formState.errors.name}
                    placeholder="Ingresa tu nombre completo"
                    required
                  />

                  <TextField
                    name="username"
                    label="Nombre de usuario"
                    register={profileForm.register}
                    error={profileForm.formState.errors.username}
                    placeholder="Ingresa tu nombre de usuario"
                    required
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Rol
                    </label>
                    <RoleSelector
                      value={profileForm.watch('role')}
                      onChange={(role) => profileForm.setValue('role', role)}
                      onRoleChangeWarning={(fromRole, toRole) => {
                        if (fromRole === 'emprendedor' && toRole === 'comprador') {
                          setShowRoleChangeWarning(true);
                        }
                      }}
                    />
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
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-primary">Ubicación</h3>
                  <button
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

                {/* Submit buttons */}
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
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cambios
                  </button>
                </div>
              </form>

              {/* Contraseña */}
              <div className="mt-8 pt-8 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">Contraseña</h3>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 text-sm bg-gray-100 text-secondary rounded-lg hover:bg-gray-200 transition-colors"
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
                        error={passwordForm.formState.errors.current_password}
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

                    {updatePasswordMutation.isError && (
                      <div className="text-red-600 text-sm">
                        Error al actualizar la contraseña. Inténtalo de nuevo.
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={updatePasswordMutation.isPending}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {updatePasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Actualizar contraseña
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

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
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
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
                profileForm.setValue('role', 'comprador');
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
