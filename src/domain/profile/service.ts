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

// Función para obtener información básica del usuario autenticado (principalmente su ID)
const getSessionUser = async () => {
  // Intentar primero desde localStorage, donde AuthContext guarda { token, user }
  try {
    const authRaw = localStorage.getItem('auth');
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      if (auth?.user?.id) return auth.user;
    }
  } catch (e) {
    // ignore JSON errors
  }

  // Fallback: intentar endpoints comunes
  try {
    // Algunos backends exponen /user como "usuario actual"
    const me = await api.get('/user').then(r => r.data).catch(() => null);
    if (me?.id) return me;
  } catch (_) {}

  // Último recurso: /users podría devolver el listado; intentamos extraer el primero
  const response = await api.get('/users');
  return Array.isArray(response.data) ? response.data[0] : response.data;
};

// Funciones reales (migradas a endpoints Laravel 10)
const real_getProfile = async (): Promise<ProfileDTO> => {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;
  const response = await api.get(`/users/${userId}`);
  const raw = response.data;

  // Derivar role numérico desde raw.role (numérico) o role_relation.nombre (string)
  const roleNumeric = typeof raw.role === 'number' ? raw.role : (() => {
    const nombre = raw?.role_relation?.nombre?.toLowerCase?.();
    if (nombre === 'administrador') return 3;
    if (nombre === 'emprendedor') return 2;
    return 1;
  })();

  const dto: ProfileDTO = {
    id: raw.id,
    name: raw.name,
    username: raw.username,
    role: roleNumeric,
    email: raw.email,
    phone: raw.phone,
    province: raw.province,
    canton: raw.canton,
    district: raw.district,
    address: raw.address,
    avatar_url: raw.avatar_url,
    banned: raw.banned,
    roleRelation: raw.role_relation ? { id: raw.role_relation.id, name: raw.role_relation.nombre } : undefined,
    interests: Array.isArray(raw.interests)
      ? raw.interests
          .filter((i: any) => i && (typeof i === 'string' || i.interest))
          .map((i: any, idx: number) => (
            typeof i === 'string' ? { id: idx + 1, user_id: raw.id, interest: i } : { id: i.id ?? idx + 1, user_id: i.user_id ?? raw.id, interest: i.interest }
          ))
      : undefined,
    entrepreneurships: raw.entrepreneurships || []
  };

  return dto;
};

const real_updateProfile = async (payload: Partial<ProfileDTO>) => {
  const sessionUser = await getSessionUser();
  return api.put<ProfileDTO>(`/users/${sessionUser.id}`, payload).then(r => r.data);
};

// Update a specific user's profile by ID (admin capability)
const real_updateProfileById = async (userId: number | string, payload: Partial<ProfileDTO>) => {
  return api.put<ProfileDTO>(`/users/${userId}`, payload).then(r => r.data);
};

const real_updatePassword = async (payload: PasswordUpdateDTO) => {
  const sessionUser = await getSessionUser();
  return api.put(`/users/${sessionUser.id}/password`, payload).then(r => r.data);
};

// Admin: reset another user's password by ID (no current_password required)
// Backend expects password changes through the general update endpoint /users/:id
// and will hash it if provided. The /users/:id/password endpoint requires current_password.
const real_adminResetPasswordById = async (userId: number | string, payload: { password: string; password_confirmation: string; }) => {
  return api.put(`/users/${userId}`, { password: payload.password }).then(r => r.data);
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

// Upload avatar for a specific user by ID (admin capability)
const real_uploadAvatarById = async (userId: number | string, imageData: string) => {
  return api.post<{ avatar_url: string }>(`/users/${userId}/avatar`, { image: imageData })
    .then(r => ({ avatarUrl: r.data.avatar_url }));
};

// Exports públicos con switch
export const getProfile = () => 
  isDemoMode() ? demo_getProfile() : real_getProfile();

export const updateProfile = (payload: Partial<ProfileDTO>) => 
  isDemoMode() ? demo_updateProfile(payload) : real_updateProfile(payload);

export const updateProfileById = (userId: number | string, payload: Partial<ProfileDTO>) => 
  real_updateProfileById(userId, payload);

export const updatePassword = (payload: PasswordUpdateDTO) => 
  isDemoMode() ? demo_updatePassword(payload) : real_updatePassword(payload);

export const adminResetPasswordById = (userId: number | string, payload: { password: string; password_confirmation: string; }) => 
  real_adminResetPasswordById(userId, payload);

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

export const uploadAvatarById = (userId: number | string, imageData: string) => 
  real_uploadAvatarById(userId, imageData);
