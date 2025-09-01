import { api } from '../../lib/api';
import { ProfileDTO, FavoritesDTO, InterestsDTO, PasswordUpdateDTO } from './dto';

export const getProfile = () => 
  api.get<ProfileDTO>('/profile').then(r => r.data);

export const updateProfile = (payload: Partial<ProfileDTO>) => 
  api.put<ProfileDTO>('/profile', payload).then(r => r.data);

export const updatePassword = (payload: PasswordUpdateDTO) =>
  api.put('/profile/password', payload).then(r => r.data);

export const getInterests = () => 
  api.get<InterestsDTO>('/profile/interests').then(r => r.data);

export const setInterests = (interests: string[]) => 
  api.put<InterestsDTO>('/profile/interests', { interests }).then(r => r.data);

export const addFavorite = (entrepreneurshipId: number) =>
  api.post<{ favorite: FavoritesDTO['favorites'][0] }>('/profile/favorites', { 
    entrepreneurship_id: entrepreneurshipId 
  }).then(r => r.data);

export const removeFavorite = (favoriteId: number) =>
  api.delete(`/profile/favorites/${favoriteId}`).then(r => r.data);

export const getFavorites = () => 
  api.get<FavoritesDTO>('/profile/favorites').then(r => r.data);

export const uploadAvatar = (imageData: string) =>
  api.post<{ avatarUrl: string }>('/profile/avatar', { image: imageData }).then(r => r.data);
