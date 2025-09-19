import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PanelPerfil } from '../components/PanelPerfil';
import { InterestCard } from '../components/InterestCard';
import { FavoriteCard } from '../components/FavoriteCard';
import { Modal } from '../components/Modal';
import axios from 'axios';
import { UserProfile } from '../domain/profile/types';

interface ProfileData extends Omit<UserProfile, 'interests'> {
  role_relation?: {
    id: number;
    nombre: string;
  };
  interests: string[];
  favorites: any[];
  businesses: any[];
}

export function Perfil() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [availableInterests] = useState(['Comida', 'Joyería', 'Ropa', 'Arte', 'Tecnología', 'Deportes', 'Música', 'Libros']);

  // Create a dedicated API client for profile requests
  const createApiClient = useCallback(() => {
    return axios.create({
      baseURL: 'http://emprendu-backend.test/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      withCredentials: true,
      timeout: 10000
    });
  }, []);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = id || 'me';
      const apiClient = createApiClient();
      
      console.log(`Fetching user data for ID: ${userId}`);
      const response = await apiClient.get(`/users/${userId}`).catch(error => {
        console.error('Profile fetch error:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.code === 'ECONNABORTED') {
          throw new Error('La solicitud está tardando demasiado. Por favor verifica tu conexión a internet.');
        }
        if (!error.response) {
          throw new Error('No se pudo conectar al servidor. Por favor verifica tu conexión a internet.');
        }
        
        throw new Error(error.response.data?.message || 'Error al cargar el perfil');
      });
      
      console.log('User data response:', response.data);
      setUser(mapApiResponseToProfile(response.data));
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching user data:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [id, createApiClient]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Map API response to profile data
  const mapApiResponseToProfile = (data: any): ProfileData => {
    const interests = data.interests || [];
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone || '',
      location: {
        province: data.province || '',
        canton: data.canton || '',
        district: data.district || '',
        address: data.address || ''
      },
      avatarUrl: data.avatar_url || '',
      role: mapRoleFromBackend(data.role, data.role_relation),
      interests: Array.isArray(interests) ? interests : [],
      favorites: data.favorites || [],
      role_relation: data.role_relation,
      businesses: data.entrepreneurships || []
    };
  };

  // Helper function to map role
  const mapRoleFromBackend = (roleId: number, roleRelation?: { nombre: string }): 'cliente' | 'emprendedor' | 'administrador' => {
    if (roleRelation?.nombre) {
      const role = roleRelation.nombre.toLowerCase();
      if (role === 'emprendedor') return 'emprendedor';
      if (role === 'administrador') return 'administrador';
      return 'cliente';
    }
    if (roleId === 3) return 'administrador';
    if (roleId === 2) return 'emprendedor';
    return 'cliente';
  };

  // Handle interest toggle
  const toggleInteres = async (interes: string) => {
    if (!user) return;
    
    const newInterests = user.interests.includes(interes)
      ? user.interests.filter(i => i !== interes)
      : [...user.interests, interes];
    
    try {
      // Update local state optimistically
      setUser(prev => prev ? { ...prev, interests: newInterests } : null);
      
      // Make API call to update interests
      const apiClient = createApiClient();
      await apiClient.put(`/users/${user.id}`, { interests: newInterests });
    } catch (err) {
      console.error('Error updating interests:', err);
      // Revert on error
      setUser(prev => prev ? { ...prev, interests: user.interests } : null);
      
      // Show error to user
      const error = err as Error;
      setError(new Error(`Error al actualizar intereses: ${error.message}`));
    }
  };

  const handleSaveInterests = () => {
    setShowInterestModal(false);
  };

  if (isLoading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="py-12">
          <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
            <p className="text-red-600 font-medium">Error al cargar el perfil: {error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Reintentar
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="py-12">
          <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
            <p className="text-gray-600 font-medium">No se pudo cargar el perfil del usuario</p>
            <button 
              onClick={() => navigate('/')} 
              className="mt-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
    </Layout>
  );
}
