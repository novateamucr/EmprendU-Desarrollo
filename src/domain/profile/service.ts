import { api } from '../../lib/api';
import { ProfileDTO, FavoritesDTO, InterestsDTO, PasswordUpdateDTO } from './dto';
import { isDemoMode, ensureDemoSeed } from '../demo';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Funciones demo
async function demo_getProfile(): Promise<ProfileDTO> {
  ensureDemoSeed();
  const raw = localStorage.getItem('demo_profile');
  await sleep(200);
  return JSON.parse(raw!);
}

async function demo_updateProfile(payload: Partial<ProfileDTO>): Promise<ProfileDTO> {
  ensureDemoSeed();
  const raw = localStorage.getItem('demo_profile');
  const current = JSON.parse(raw!);
  
  // Preservar campos que no están en el payload (como avatar_url)
  const merged = { ...current, ...payload };
  
  // Asegurar que avatar_url no se pierda si no está en el payload
  if (!payload.avatar_url && current.avatar_url) {
    merged.avatar_url = current.avatar_url;
  }
  
  localStorage.setItem('demo_profile', JSON.stringify(merged));
  await sleep(300);
  return merged;
}

async function demo_updatePassword(_payload: PasswordUpdateDTO): Promise<{ ok: boolean }> {
  await sleep(300);
  return { ok: true };
}

async function demo_getInterests(): Promise<InterestsDTO> {
  ensureDemoSeed();
  const raw = localStorage.getItem('demo_interests');
  await sleep(150);
  return { interests: JSON.parse(raw!) };
}

async function demo_setInterests(interests: string[]): Promise<InterestsDTO> {
  localStorage.setItem('demo_interests', JSON.stringify(interests));
  await sleep(200);
  return { interests };
}

async function demo_getFavorites(): Promise<FavoritesDTO> {
  ensureDemoSeed();
  const raw = localStorage.getItem('demo_favorites');
  await sleep(200);
  return { favorites: JSON.parse(raw!) };
}

async function demo_addFavorite(entrepreneurshipId: number): Promise<{ favorite: FavoritesDTO['favorites'][0] }> {
  ensureDemoSeed();
  const raw = localStorage.getItem('demo_favorites');
  const favorites = JSON.parse(raw!);
  const newFavorite = {
    id: Date.now(),
    entrepreneurship_id: entrepreneurshipId,
    name: `Emprendimiento ${entrepreneurshipId}`,
    category: 'demo',
    image_url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg',
    link: `/emprendimientos/${entrepreneurshipId}`,
    created_at: new Date().toISOString()
  };
  favorites.push(newFavorite);
  localStorage.setItem('demo_favorites', JSON.stringify(favorites));
  await sleep(250);
  return { favorite: newFavorite };
}

async function demo_removeFavorite(favoriteId: number): Promise<{ ok: boolean }> {
  ensureDemoSeed();
  const raw = localStorage.getItem('demo_favorites');
  const favorites = JSON.parse(raw!);
  const filtered = favorites.filter((f: any) => f.id !== favoriteId);
  localStorage.setItem('demo_favorites', JSON.stringify(filtered));
  await sleep(200);
  return { ok: true };
}

async function demo_uploadAvatar(imageData: string): Promise<{ avatarUrl: string }> {
  ensureDemoSeed();
  const raw = localStorage.getItem('demo_profile');
  const profile = JSON.parse(raw!);
  profile.avatar_url = imageData; // En demo, usar la imagen directamente
  localStorage.setItem('demo_profile', JSON.stringify(profile));
  await sleep(400);
  return { avatarUrl: imageData };
}

// Función para obtener el usuario de la sesión actual
const getSessionUser = async () => {
  // Intentar obtener el usuario autenticado desde la sesión
  // Laravel típicamente expone esto en /api/user con middleware auth:sanctum
  // Como no existe ese endpoint, usaremos /api/users/me o similar
  // Por ahora, asumimos que el backend tiene un endpoint para obtener el usuario actual
  try {
    // Primero intentamos con un endpoint de sesión estándar
    const response = await api.get('/user');
    return response.data;
  } catch (error: any) {
    // Si no existe /user, intentamos con el primer usuario (para desarrollo)
    // En producción esto debería fallar y mostrar error de autenticación
    if (error?.response?.status === 404) {
      // Fallback: usar usuario ID 1 para desarrollo
      const response = await api.get('/users/1');
      return response.data;
    }
    throw error;
  }
};

// Funciones reales (migradas a endpoints Laravel 10)
const real_getProfile = async () => {
  const sessionUser = await getSessionUser();
  return sessionUser; // El usuario ya viene con toda la información necesaria
};

const real_updateProfile = async (payload: Partial<ProfileDTO>) => {
  const sessionUser = await getSessionUser();
  return api.put<ProfileDTO>(`/users/${sessionUser.id}`, payload).then(r => r.data);
};

const real_updatePassword = async (payload: PasswordUpdateDTO) => {
  const sessionUser = await getSessionUser();
  return api.put(`/users/${sessionUser.id}/password`, payload).then(r => r.data);
};

const real_getInterests = async () => {
  const sessionUser = await getSessionUser();
  return api.get<InterestsDTO>(`/interests?user_id=${sessionUser.id}`).then(r => r.data);
};

const real_setInterests = async (interests: string[]) => {
  const sessionUser = await getSessionUser();
  // Eliminar intereses existentes y crear nuevos
  const existingInterests = await api.get(`/interests?user_id=${sessionUser.id}`);
  
  // Eliminar intereses existentes
  if (existingInterests.data.data) {
    for (const interest of existingInterests.data.data) {
      await api.delete(`/interests/${interest.id}`);
    }
  }
  
  // Crear nuevos intereses
  const createdInterests = [];
  for (const interest of interests) {
    await api.post('/interests', { 
      user_id: sessionUser.id, 
      interest 
    });
    createdInterests.push(interest);
  }
  
  return { interests: createdInterests };
};

const real_addFavorite = async (entrepreneurshipId: number) => {
  const sessionUser = await getSessionUser();
  return api.post<{ favorite: FavoritesDTO['favorites'][0] }>('/favorites', { 
    user_id: sessionUser.id,
    entrepreneurship_id: entrepreneurshipId 
  }).then(r => r.data);
};

const real_removeFavorite = (favoriteId: number) =>
  api.delete(`/favorites/${favoriteId}`).then(r => r.data);

const real_getFavorites = async () => {
  const sessionUser = await getSessionUser();
  return api.get<FavoritesDTO>(`/favorites?user_id=${sessionUser.id}`).then(r => r.data);
};

const real_uploadAvatar = async (imageData: string) => {
  const sessionUser = await getSessionUser();
  return api.post<{ avatar_url: string }>(`/users/${sessionUser.id}/avatar`, { image: imageData })
    .then(r => ({ avatarUrl: r.data.avatar_url })); // Mapear snake_case a camelCase
};

// Exports públicos con switch
export const getProfile = () => 
  isDemoMode() ? demo_getProfile() : real_getProfile();

export const updateProfile = (payload: Partial<ProfileDTO>) => 
  isDemoMode() ? demo_updateProfile(payload) : real_updateProfile(payload);

export const updatePassword = (payload: PasswordUpdateDTO) => 
  isDemoMode() ? demo_updatePassword(payload) : real_updatePassword(payload);

export const getInterests = () => 
  isDemoMode() ? demo_getInterests() : real_getInterests();

export const setInterests = (interests: string[]) => 
  isDemoMode() ? demo_setInterests(interests) : real_setInterests(interests);

export const getFavorites = () => 
  isDemoMode() ? demo_getFavorites() : real_getFavorites();

export const addFavorite = (entrepreneurshipId: number) => 
  isDemoMode() ? demo_addFavorite(entrepreneurshipId) : real_addFavorite(entrepreneurshipId);

export const removeFavorite = (favoriteId: number) => 
  isDemoMode() ? demo_removeFavorite(favoriteId) : real_removeFavorite(favoriteId);

export const uploadAvatar = (imageData: string) => 
  isDemoMode() ? demo_uploadAvatar(imageData) : real_uploadAvatar(imageData);
