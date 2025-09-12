import { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/navbar';
import { PanelPerfil } from '../components/PanelPerfil';
import { InterestCard } from '../components/InterestCard';
import { FavoriteCard } from '../components/FavoriteCard';
import { Modal } from '../components/Modal';
import { useProfile, useUpdateInterests } from '../domain/profile/queries';
// TODO: reactivar cuando el equipo de auth dé el flujo final
// import { getToken } from '../domain/auth';

export function Perfil() {
  const { data: user, isLoading, isError, error, refetch } = useProfile() as any;
  const updateInterestsMutation = useUpdateInterests();
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const availableInterests = ['Comida', 'Joyería', 'Ropa', 'Arte', 'Tecnología', 'Deportes', 'Música', 'Libros'];

  const toggleInteres = (interes: string) => {
    if (!user || !user.interests) return;
    const newInterests = user.interests.includes(interes)
      ? user.interests.filter((i: string) => i !== interes)
      : [...user.interests, interes];
    updateInterestsMutation.mutate(newInterests);
  };

  const handleSaveInterests = () => {
    setShowInterestModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar
          logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
          maxWidth="max-w-3xl"
          items={[
            { type: 'link', label: 'Inicio', to: '/' },
            { type: 'link', label: 'Emprendimientos', to: '/feed/emprendimiento' },
            { type: 'link', label: 'Ferias', to: '/ferias' },
          ]}
          rightContent={
            <Link
              to="/perfil"
              className="p-2 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-primary bg-gray-50"
              aria-label="Ir al perfil"
            >
              <User className="w-5 h-5" />
            </Link>
          }
        />
        <div className="pt-20 px-4 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 mt-6">
              <div className="bg-white rounded-card shadow-soft border border-border p-6">
                <div className="text-center mb-6">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 mt-6">
              <div className="bg-white rounded-card shadow-soft border border-border p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-[136px] h-[96px] bg-gray-200 rounded-card animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar
          logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
          maxWidth="max-w-3xl"
          items={[
            { type: 'link', label: 'Inicio', to: '/' },
            { type: 'link', label: 'Emprendimientos', to: '/feed/emprendimiento' },
            { type: 'link', label: 'Ferias', to: '/ferias' },
          ]}
          rightContent={
            <Link
              to="/perfil"
              className="p-2 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-primary bg-gray-50"
              aria-label="Ir al perfil"
            >
              <User className="w-5 h-5" />
            </Link>
          }
        />
        <div className="pt-20 px-4 max-w-6xl mx-auto">
          <div className="py-12">
            <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
              <p className="text-red-600 font-medium">Error al cargar el perfil</p>
              <button onClick={() => refetch()} className="mt-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar
          logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
          maxWidth="max-w-3xl"
          items={[
            { type: 'link', label: 'Inicio', to: '/' },
            { type: 'link', label: 'Emprendimientos', to: '/feed/emprendimiento' },
            { type: 'link', label: 'Ferias', to: '/ferias' },
          ]}
          rightContent={
            <Link
              to="/perfil"
              className="p-2 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-primary bg-gray-50"
              aria-label="Ir al perfil"
            >
              <User className="w-5 h-5" />
            </Link>
          }
        />
        <div className="pt-20 px-4 max-w-6xl mx-auto">
          <div className="py-12">
            <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
              <p className="text-gray-600 font-medium">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
        maxWidth="max-w-3xl"
        items={[
          { type: 'link', label: 'Inicio', to: '/' },
          { type: 'link', label: 'Emprendimientos', to: '/feed/emprendimiento' },
          { type: 'link', label: 'Ferias', to: '/ferias' },
        ]}
        rightContent={
          <Link
            to="/perfil"
            className="p-2 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-primary bg-gray-50"
            aria-label="Ir al perfil"
          >
            <User className="w-5 h-5" />
          </Link>
        }
      />
      
      <div className="pt-20 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel izquierdo - Información del usuario */}
          <div className="lg:col-span-1 mt-6">
            <PanelPerfil 
              user={user}
              onContactInfoClick={() => setShowContactModal(true)}
              onLocationInfoClick={() => setShowLocationModal(true)}
            />
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8 mt-6">
            {/* Sección de Intereses */}
            <div className="bg-white rounded-card shadow-soft border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary">Intereses</h2>
                <button
                  onClick={() => setShowInterestModal(true)}
                  className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                  aria-label="Agregar interés"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {user.interests?.map((interest: string) => (
                  <InterestCard
                    key={interest}
                    title={interest}
                    onRemove={() => toggleInteres(interest)}
                  />
                )) || []}
              </div>
            </div>

            {/* Sección de Favoritos */}
            <div className="bg-white rounded-card shadow-soft border border-border p-6">
              <h2 className="text-xl font-semibold text-primary mb-6">Favoritos</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {user.favorites?.map((favorito: any) => (
                  <FavoriteCard
                    key={favorito.id}
                    title={favorito.name}
                    imgUrl={favorito.imageUrl}
                  />
                )) || []}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Editar Intereses */}
      <Modal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        title="Editar intereses"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary mb-4">
            Selecciona los temas que más te interesan para personalizar tu experiencia.
          </p>
          
          <div className="space-y-3">
            {availableInterests.map((interes) => (
              <label key={interes} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={user.interests?.includes(interes) || false}
                  onChange={() => toggleInteres(interes)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm text-primary">{interes}</span>
              </label>
            ))}
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveInterests}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Información de Contacto */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Sobre tu información de contacto"
      >
        <div className="space-y-4 text-sm text-secondary">
          <p>
            Tu información de contacto es visible para otros usuarios cuando interactúas 
            en la plataforma. Esto incluye tu correo electrónico y número de teléfono.
          </p>
          <p>
            Puedes controlar qué información compartes en la configuración de privacidad 
            de tu perfil.
          </p>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowContactModal(false)}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Entendido
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
