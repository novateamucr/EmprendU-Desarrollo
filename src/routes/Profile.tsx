import { useState, useEffect, useCallback } from 'react';
import useScrollTop from '../hooks/useScrollTop';
import { Plus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import { PanelPerfil } from '../components/PanelPerfil';
import { InterestCard } from '../components/InterestCard';
// import { FavoriteCard } from '../components/FavoriteCard';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import { useRemoveFavorite } from '../domain/profile/queries';
// import { useUpdateInterests } from '../domain/profile/queries';
import { UserProfile } from '../domain/profile/types';
import { ConfettiOverlay } from '../components/Confetti';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi, entrepreneurshipApi, type Entrepreneurship } from '../services/entrepreneurshipService';
import { categoryIconUrl } from '../utils/categoryIcons';
import { Favorite } from '@mui/icons-material';

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
  const navigate = useNavigate();
  const { user: authUser, token } = useAuth();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  // Eliminación directa desde el botón del corazón (sin modal)
  const [favPendingById, setFavPendingById] = useState<Record<number, boolean>>({});
  // Confirmación para eliminar favorito desde el perfil
  const [showFavRemoveModal, setShowFavRemoveModal] = useState(false);
  const [favToRemove, setFavToRemove] = useState<number | null>(null);
  // Hook de eliminación de favoritos
  const removeFav = useRemoveFavorite();
  // Cache local de detalles de emprendimientos para favoritos
  const [favDetailMap, setFavDetailMap] = useState<Record<number, { name: string; image_url: string }>>({});
  // Categories from backend for interests picker
  interface ICategory {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
  }

  const { data: categoriesData, isLoading: loadingCategories } = useQuery<ICategory[]>({
    queryKey: ['categories', 'profile'],
    queryFn: async (): Promise<ICategory[]> => {
      try {
        const response = await categoryApi.getAll();
        console.log('Categories API Response:', response);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          return response as ICategory[];
        } else if (response && typeof response === 'object' && 'data' in response) {
          return Array.isArray(response.data) ? response.data as ICategory[] : [];
        }
        return [];
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        if (error.response?.status === 429) {
          // If rate limited, show a user-friendly message
          setError(new Error('Estamos experimentando mucho tráfico. Por favor intente de nuevo en un momento.'));
        }
        throw error; // Let React Query handle retries
      }
    },
    retry: 2, // Retry up to 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  const categories = categoriesData || [];
  const [showConfetti, setShowConfetti] = useState(false);
  // Carga y reintentos por sección
  const [interestsLoaded, setInterestsLoaded] = useState(false);
  const [interestsRetry, setInterestsRetry] = useState(0);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [favoritesRetry, setFavoritesRetry] = useState(0);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Use shared API client (configured with token via interceptors/localStorage)
  const createApiClient = useCallback(() => api, []);

  // Skip initial data fetch if we already have the user data from auth context
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch user data
  const fetchUserData = useCallback(async (force = false) => {
    if (!authUser) return; // Don't fetch if no authenticated user
    
    // Skip initial fetch if we already have the data from auth context
    if (initialLoad && authUser && !force) {
      setInitialLoad(false);
      setUser(mapApiResponseToProfile(authUser));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const apiClient = createApiClient();
      console.log(`Fetching user data for ID: ${authUser.id}`);
      const response = await apiClient.get(`/users/${authUser.id}`, {
        // Add a custom header to prevent token refresh on this request
        headers: {
          'X-Skip-Refresh': 'true'
        }
      }).catch(error => {
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
  }, [authUser, createApiClient, initialLoad]);

  // Initial data load
  useEffect(() => {
    if (authUser) {
      // Only fetch data if we don't have it already from auth context
      if (initialLoad) {
        fetchUserData();
      }
    }
  }, [authUser, fetchUserData, initialLoad]);

  // Scroll to top on page load
  useScrollTop('auto');

  // Trigger confetti if coming from Editar Perfil (celebration flag)
  useEffect(() => {
    const flag = localStorage.getItem('celebrate');
    if (flag === 'profile_saved') {
      setShowConfetti(true);
      localStorage.removeItem('celebrate');
    }
  }, []);

  // Sync interests con reintentos (hasta 3), sin recargar página
  useEffect(() => {
    let timer: any;
    const loadInterests = async () => {
      if (!authUser || !user || !categories) return;
      if (interestsLoaded) return; // si ya cargó alguna vez, no reintentes
      try {
        const res = await api.get('/interests', { params: { user_id: authUser.id } });
        const rows = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        const byId = new Map<number, string>(categories.map(c => [c.id, c.name]));
        const names = rows
          .map((r: any) => byId.get(typeof r.category_id === 'string' ? parseInt(r.category_id, 10) : r.category_id))
          .filter(Boolean) as string[];
        setUser(prev => prev ? { ...prev, interests: names } : prev);
        setInterestsLoaded(true);
      } catch (err) {
        console.warn('No se pudieron sincronizar intereses', err);
        if (!interestsLoaded && interestsRetry < 6) {
          // backoff progresivo (hasta 6 intentos): 1.2s, 2.4s, 3.6s, 4.8s, 6.0s, 7.2s
          const delay = 1200 * (interestsRetry + 1);
          timer = setTimeout(() => setInterestsRetry(r => r + 1), delay);
        }
      }
    };
    loadInterests();
    return () => timer && clearTimeout(timer);
  }, [authUser, user?.id, categories, interestsRetry, interestsLoaded]);

  // Sync favorites con reintentos (hasta 3), sin recargar página
  useEffect(() => {
    let timer: any;
    const loadFavorites = async () => {
      if (!authUser || !user) return;
      if (favoritesLoaded) return; // si ya cargó alguna vez, no reintentes
      try {
        const res = await api.get('/favorites', { params: { user_id: authUser.id } });
        const rows = Array.isArray(res.data?.favorites)
          ? res.data.favorites
          : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
        setUser(prev => prev ? { ...prev, favorites: rows } : prev);
        setFavoritesLoaded(true);
      } catch (err) {
        console.warn('No se pudieron sincronizar favoritos', err);
        if (!favoritesLoaded && favoritesRetry < 6) {
          // backoff progresivo (hasta 6 intentos): 1.2s, 2.4s, 3.6s, 4.8s, 6.0s, 7.2s
          const delay = 1200 * (favoritesRetry + 1);
          timer = setTimeout(() => setFavoritesRetry(r => r + 1), delay);
        }
      }
    };
    loadFavorites();
    return () => timer && clearTimeout(timer);
  }, [authUser, user?.id, favoritesRetry, favoritesLoaded]);

  // Cargar detalles (nombre, imagen) de cada favorito por entrepreneurship_id
  useEffect(() => {
    const loadFavoriteDetails = async () => {
      const favs = user?.favorites || [];
      if (!favs.length) return;
      const missingIds = favs
        .map((f: any) => Number(f?.entrepreneurship_id))
        .filter((id: number) => Number.isFinite(id) && !favDetailMap[id]);
      if (!missingIds.length) return;
      try {
        const results = await Promise.allSettled(
          missingIds.map((id) => entrepreneurshipApi.getById(String(id)))
        );
        const additions: Record<number, { name: string; image_url: string }> = {};
        results.forEach((r, idx) => {
          const id = missingIds[idx];
          if (r.status === 'fulfilled' && r.value) {
            const e = r.value as Entrepreneurship;
            additions[id] = { name: e.name, image_url: e.image_url || '' };
          } else {
            additions[id] = { name: 'Emprendimiento', image_url: '' };
          }
        });
        setFavDetailMap((prev) => ({ ...prev, ...additions }));
      } catch (_) {
        // silencioso
      }
    };
    loadFavoriteDetails();
  }, [user?.favorites, favDetailMap]);

  // Map API response to profile data
  const mapApiResponseToProfile = (data: any): ProfileData => {
    const interestsRaw = data.interests || [];
    const interests = Array.isArray(interestsRaw)
      ? interestsRaw.map((i: any) => (typeof i === 'string' ? i : (i?.interest ?? ''))).filter(Boolean)
      : [];
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone || '---',
      location: {
        province: data.province || '---',
        canton: data.canton || '---',
        district: data.district || '---',
        address: data.address || '---'
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
  const mapRoleFromBackend = (roleId: number, roleRelation?: { name: string }): 'comprador' | 'emprendedor' | 'administrador' => {
    if (roleRelation?.name) {
      const role = roleRelation.name.toLowerCase();
      if (role === 'emprendedor') return 'emprendedor';
      if (role === 'administrador') return 'administrador';
      return 'comprador';
    }
    if (roleId === 3) return 'administrador';
    if (roleId === 2) return 'emprendedor';
    return 'comprador';
  };

  // Use centralized icon utility to ensure consistent icons with fallback
  const iconUrlForCategory = (name: string) => categoryIconUrl(name);

  // Add interest by category (user_interests)
  const addInterestByCategory = async (category: { id: number; name: string }) => {
    if (!authUser || !user) return;
    
    // Optimistically update UI
    const categoryName = category.name;
    setUser(prev => prev ? { 
      ...prev, 
      interests: Array.from(new Set([...(prev.interests || []), categoryName])) 
    } : prev);
    
    try {
      await api.post('/interests', { user_id: authUser.id, category_id: category.id });
      // Invalidate caches so Home reflects updated interests
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['interests', 'home', authUser.id] });
    } catch (err: any) {
      // Revert UI on error
      setUser(prev => prev ? { 
        ...prev, 
        interests: (prev.interests || []).filter(i => i !== categoryName) 
      } : prev);
      setError(new Error(err?.response?.data?.message || 'No se pudo agregar el interés'));
    }
  };

  // Remove interest by category name: find record by category_id then delete
  const removeInterestByName = async (categoryName: string) => {
    if (!authUser || !user) return;
    
    // Find category_id by name
    const cat = (categories || []).find(c => (c.name || '').toLowerCase() === categoryName.toLowerCase());
    if (!cat) {
      setError(new Error('Categoría no encontrada'));
      return;
    }
    
    // Optimistically update UI
    setUser(prev => prev ? { 
      ...prev, 
      interests: (prev.interests || []).filter(i => i !== categoryName) 
    } : prev);
    
    try {
      // Find the interest record by querying with user_id and category_id
      const res = await api.get('/interests', { 
        params: { user_id: authUser.id, category_id: cat.id } 
      });
      
      const records = Array.isArray(res.data?.data) ? res.data.data : 
                     (Array.isArray(res.data) ? res.data : []);
      
      const target = records[0];
      if (target?.id) {
        await api.delete(`/interests/${target.id}`);
      }
      
      // Invalidate caches so Home reflects updated interests
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['interests', 'home', authUser.id] });
    } catch (err: any) {
      // Revert UI on error
      setUser(prev => prev ? { 
        ...prev, 
        interests: Array.from(new Set([...(prev.interests || []), categoryName])) 
      } : prev);
      setError(new Error(err?.response?.data?.message || 'No se pudo eliminar el interés'));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 mt-6">
            <div className="bg-white rounded-card shadow-soft border border-border p-6">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-brand/10 rounded-full mx-auto animate-pulse"></div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-brand/10 rounded animate-pulse"></div>
                  <div className="h-3 bg-brand/10 rounded animate-pulse w-3/4 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 mt-6">
            <div className="bg-white rounded-card shadow-soft border border-border p-6">
              <div className="h-6 bg-brand/10 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-[136px] h-[96px] bg-brand/10 rounded-card animate-pulse"></div>
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
              className="mt-2 px-4 py-2 rounded-lg border border-border hover:bg-brand/10 hover:text-brand transition-colors focus-brand"
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
              className="mt-2 px-4 py-2 rounded-lg border border-border hover:bg-brand/10 hover:text-brand transition-colors focus-brand"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Robust admin detection: by mapped role string or role_relation
  const isAdmin =
    user.role === 'administrador' ||
    user.role_relation?.id === 3 ||
    user.role_relation?.nombre?.toLowerCase?.() === 'administrador';

  // If viewing own profile and user is admin: center the profile panel and hide interests/favorites
  if (isAdmin) {
    return (
      <Layout>
        <ConfettiOverlay active={showConfetti} durationMs={1200} />
        <div className="mt-8 lg:mt-10 flex justify-center px-4">
          <div className="w-full max-w-3xl mt-6">
            <PanelPerfil
              user={user}
              onContactInfoClick={() => setShowContactModal(true)}
              onLocationInfoClick={() => setShowLocationModal(true)}
              hideEdit
            />
          </div>
        </div>

        {/* Modal de Información de Contacto */}
        <Modal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          title="Sobre tu información de contacto"
          variant="info"
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
          variant="info"
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

  return (
    <Layout>
      <ConfettiOverlay active={showConfetti} durationMs={1200} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 lg:mt-10">
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
          {/* Secciones estándar (no admin) */}
          <>
              {/* Sección de Intereses */}
              <div className="bg-white rounded-card shadow-soft border border-border p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-primary">Intereses</h2>
                  <button
                    onClick={() => setShowInterestModal(true)}
                    className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brandDark transition-colors focus-brand"
                    aria-label="Agregar interés"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  </div>
                  <h2 className="text-xs text-brand/100 mb-2">¿Cuáles son tus gustos? Dale click al botón de "+" para agregar.</h2>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {user.interests?.map((interest: string) => (
                    <InterestCard
                      key={interest}
                      title={interest}
                      iconUrl={iconUrlForCategory(interest)}
                      onRemove={() => removeInterestByName(interest)}
                    />
                  )) || []}
                </div>
              </div>

              {/* Sección de Favoritos */}
              <div className="bg-white rounded-card shadow-soft border border-border p-6">
                <h2 className="text-xl font-semibold text-primary mb-1">Favoritos</h2>
                <h2 className="text-xs text-brand/100 mb-6">Mis emprendimientos favoritos</h2>
                {/* Mostrar botón para ir al inicio cuando no hay favoritos */}
                {(!(user.favorites || []) || (user.favorites || []).length === 0) ? (
                  <div className="py-6 flex flex-col items-center justify-center">
                    <p className="text-sm text-secondary mb-4">No tienes favoritos seleccionados todavía.</p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brandDark transition-colors"
                    >
                      Ir al inicio
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(user.favorites || []).map((favorito: any) => {
                      const entreId = Number(favorito?.entrepreneurship_id);
                      const detail = Number.isFinite(entreId) ? favDetailMap[entreId] : undefined;
                      const title = favorito?.name || detail?.name || favorito?.entrepreneurship?.name || 'Emprendimiento';
                      const imgUrl = favorito?.imageUrl || favorito?.image_url || detail?.image_url || favorito?.entrepreneurship?.image_url || 'https://placehold.co/600x600?text=Sin+imagen';
                      return (
                        <Link
                          key={favorito.id ?? `${title}-${imgUrl}`}
                          to={`/business/${entreId || ''}`}
                          className="block"
                          onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
                        >
                          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col">
                            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                              <img
                                src={imgUrl}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!favorito?.id) return;
                                  setFavToRemove(favorito.id);
                                  setShowFavRemoveModal(true);
                                }}
                                disabled={!!favPendingById[favorito.id]}
                                className="group absolute top-2 right-2 rounded-full flex items-center justify-center bg-white text-[#0A5B7A] border border-border shadow-md p-2.5 disabled:opacity-60 hover:bg-[#0A5B7A] hover:border-[#0A5B7A]"
                                aria-label="Quitar de favoritos"
                                title="Quitar de favoritos"
                              >
                                <Favorite sx={{ fontSize: 18 }} className="text-[#0A5B7A] group-hover:text-white" />
                              </button>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{title}</h3>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
          </>
        </div>
      </div>

      {/* Modal de Editar Intereses (no admin) */}
      {/* Modal de confirmar eliminación de favorito (Perfil) */}
      <Modal
        isOpen={showFavRemoveModal}
        onClose={() => setShowFavRemoveModal(false)}
        title="Eliminar de favoritos"
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">¿Estás seguro de que deseas eliminar este emprendimiento de tus favoritos?</p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowFavRemoveModal(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!favToRemove) { setShowFavRemoveModal(false); return; }
                const id = favToRemove;
                setFavPendingById((p) => ({ ...p, [id]: true }));
                removeFav.mutate(id, {
                  onSettled: () => {
                    setFavPendingById((p) => ({ ...p, [id]: false }));
                    setShowFavRemoveModal(false);
                    setFavToRemove(null);
                  },
                  onSuccess: () => {
                    setUser((prev) => prev ? { ...prev, favorites: (prev.favorites || []).filter((f: any) => f.id !== id) } : prev);
                    queryClient.invalidateQueries({ queryKey: ['profile'] });
                  }
                });
              }}
              className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brandDark"
              disabled={!!(favToRemove && favPendingById[favToRemove])}
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        title="Editar intereses"
        variant="edit"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary mb-4">
            Selecciona los temas que más te interesan para personalizar tu experiencia.
          </p>
          {loadingCategories ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : categoriesData && categoriesData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoriesData.map((cat) => {
                if (!cat || !cat.name) return null;
                
                const categoryName = cat.name.trim();
                const isSelected = (user?.interests || []).some(
                  (i: string) => i && i.toLowerCase() === categoryName.toLowerCase()
                );
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => (isSelected ? removeInterestByName(categoryName) : addInterestByCategory(cat))}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand/10'
                        : 'border-border hover:border-brand/50 hover:bg-brand/5'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="flex items-center gap-3">
                      <img 
                        src={iconUrlForCategory(categoryName)} 
                        alt={categoryName} 
                        className="w-6 h-6 object-contain flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/default-category-icon.png';
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {categoryName}
                      </span>
                    </span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No se encontraron categorías disponibles.
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Información de Contacto */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Sobre tu información de contacto"
        variant="info"
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
              className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors focus-brand"
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
        variant="info"
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
    </Layout>
  );
}
