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

// Helper para obtener user ID actual
const getCurrentUserId = (): number => {
  // TODO: Implementar lógica para obtener el ID del usuario actual
  // Por ahora retornamos 1, pero debería venir del token JWT o contexto de auth
  return 1;
};

// Funciones reales (migradas a endpoints Laravel 10)
const real_getProfile = () => {
  const userId = getCurrentUserId();
  return api.get<ProfileDTO>(`/users/${userId}`).then(r => r.data);
};

const real_updateProfile = (payload: Partial<ProfileDTO>) => {
  const userId = getCurrentUserId();
  return api.put<ProfileDTO>(`/users/${userId}`, payload).then(r => r.data);
};

const real_updatePassword = (payload: PasswordUpdateDTO) => {
  const userId = getCurrentUserId();
  return api.put(`/users/${userId}/password`, payload).then(r => r.data);
};

const real_getInterests = () => 
  api.get<InterestsDTO>('/interests').then(r => r.data);

const real_setInterests = (interests: string[]) => 
  api.post<InterestsDTO>('/interests', { interests }).then(r => r.data);

const real_addFavorite = (entrepreneurshipId: number) =>
  api.post<{ favorite: FavoritesDTO['favorites'][0] }>('/favorites', { 
    entrepreneurship_id: entrepreneurshipId 
  }).then(r => r.data);

const real_removeFavorite = (favoriteId: number) =>
  api.delete(`/favorites/${favoriteId}`).then(r => r.data);

const real_getFavorites = () => 
  api.get<FavoritesDTO>('/favorites').then(r => r.data);

const real_uploadAvatar = (imageData: string) => {
  const userId = getCurrentUserId();
  return api.post<{ avatar_url: string }>(`/users/${userId}/avatar`, { image: imageData })
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
