import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, setInterests, updatePassword, uploadAvatar, getInterests, getFavorites, addFavorite, removeFavorite } from './service';
import { mapFavoritesDTO, mapProfileDTO, mapToProfileDTO } from './mapper';
import { UserProfile, Favorito } from './types';
import { PasswordUpdateDTO } from './dto';
import type { ApiError } from '../errors';
import { onTokenChange, getToken } from '../auth';

export const PROFILE_KEY = ['profile'];
export const INTERESTS_KEY = ['profile', 'interests'];
export const FAVORITES_KEY = ['profile', 'favorites'];

export function useProfile() {
  const q = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const [profileData, interestsData, favoritesData] = await Promise.all([
        getProfile(),
        getInterests(),
        getFavorites()
      ]);
      return mapProfileDTO(
        profileData, 
        interestsData.interests, 
        mapFavoritesDTO(favoritesData)
      );
    },
    retry: (count, error: ApiError) => {
      // no reintentar en unauth o notfound; 1 reintento en server/network
      if (error?.kind === 'unauth' || error?.kind === 'notfound') return false;
      if (error?.kind === 'server' || error?.kind === 'network') return count < 1;
      return false;
    }
  }) as ReturnType<typeof useQuery> & { error: ApiError | null };

  // Sensible a futuras credenciales: si el token cambia, refetch
  useEffect(() => {
    const off = onTokenChange(() => {
      if (getToken()) q.refetch();
    });
    return off;
  }, [q]);

  return q;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => updateProfile(mapToProfileDTO(profile)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    }
  });
}

export function useUpdateInterests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interests: string[]) => setInterests(interests),
    onMutate: async (newInterests) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEY });
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEY);
      
      queryClient.setQueryData<UserProfile>(PROFILE_KEY, (old) => 
        old ? { ...old, interests: newInterests } : old
      );
      
      return { previousProfile };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_KEY, context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    }
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entrepreneurshipId: number) => addFavorite(entrepreneurshipId),
    onSuccess: (data) => {
      queryClient.setQueryData<UserProfile>(PROFILE_KEY, (old) => {
        if (!old) return old;
        
        // Map the DTO response to match our Favorito type
        const newFavorite: Favorito = {
          id: data.favorite.id,
          entrepreneurship_id: data.favorite.entrepreneurship_id,
          name: data.favorite.name,
          imageUrl: data.favorite.image_url,
          link: data.favorite.link,
          category: data.favorite.category as any,
          created_at: data.favorite.created_at
        };
        
        return { ...old, favorites: [...old.favorites, newFavorite] };
      });
    }
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteId: number) => removeFavorite(favoriteId),
    onSuccess: (_, favoriteId) => {
      queryClient.setQueryData<UserProfile>(PROFILE_KEY, (old) => 
        old ? { ...old, favorites: old.favorites.filter(f => f.id !== favoriteId) } : old
      );
    }
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: PasswordUpdateDTO) => updatePassword(payload)
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (imageData: string) => uploadAvatar(imageData),
    onSuccess: (data: { avatarUrl: string }) => {
      // Actualizar el avatar en el cache del perfil
      queryClient.setQueryData<UserProfile>(PROFILE_KEY, (old) => 
        old ? { ...old, avatarUrl: data.avatarUrl } : old
      );
    }
  });
}
