// TODO: reactivar cuando el equipo de auth dé el flujo final
// import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, setInterests, updatePassword, uploadAvatar, getInterests, getFavorites, addFavorite, removeFavorite, updateProfileById, uploadAvatarById, adminResetPasswordById } from './service';
import { api } from '../../lib/api';
import { mapFavoritesDTO, mapProfileDTO, mapToProfileDTO } from './mapper';
import { UserProfile, Favorito } from './types';
import { PasswordUpdateDTO } from './dto';
import type { ApiError } from '../errors';
// TODO: reactivar cuando el equipo de auth dé el flujo final
// import { onTokenChange, getToken } from '../auth';

export const PROFILE_KEY = ['profile'];
export const INTERESTS_KEY = ['profile', 'interests'];
export const FAVORITES_KEY = ['profile', 'favorites'];

export function useProfile() {
  const q = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      // En modo sesión, obtenemos todo desde el perfil principal
      const profileData = await getProfile();

      // Hacer las otras cargas de forma tolerante a errores/formatos
      const [interestsRes, favoritesRes] = await Promise.allSettled([
        getInterests(),
        getFavorites()
      ]);

      // Normalizar intereses
      let interests: string[] = [];
      if (interestsRes.status === 'fulfilled') {
        const raw = interestsRes.value as any;
        const rawList = Array.isArray(raw?.interests) ? raw.interests : (raw?.data ?? []);
        interests = rawList.map((i: any) => (typeof i === 'string' ? i : (i?.interest ?? i?.name ?? ''))).filter(Boolean);
      }

      // Normalizar favoritos y mapear a nuestro tipo mediante mapper
      let favoritesMapped;
      if (favoritesRes.status === 'fulfilled') {
        const favRaw = favoritesRes.value as any;
        const favoritesDTO = {
          favorites: Array.isArray(favRaw?.favorites) ? favRaw.favorites : (favRaw?.data ?? [])
        } as any;
        favoritesMapped = mapFavoritesDTO(favoritesDTO);
      } else {
        favoritesMapped = mapFavoritesDTO({ favorites: [] } as any);
      }

      return mapProfileDTO(profileData, interests, favoritesMapped);
    },
    retry: (count, error: ApiError) => {
      // No reintentar en 401/419 (sin sesión); 1 reintento en 5xx/network
      if (error?.kind === 'unauth') return false;
      if (error?.kind === 'notfound') return false;
      if (error?.kind === 'server' || error?.kind === 'network') return count < 1;
      return false;
    }
  }) as ReturnType<typeof useQuery> & { error: ApiError | null };

  // TODO: reactivar cuando el equipo de auth dé el flujo final
  // Sensible a futuras credenciales: si el token cambia, refetch
  /*
  useEffect(() => {
    const off = onTokenChange(() => {
      if (getToken()) q.refetch();
    });
    return off;
  }, [q]);
  */

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

// Admin-only: reset another user's password by ID without current password
export function useAdminResetPasswordById(userId: string | number) {
  return useMutation({
    mutationFn: (payload: { password: string; password_confirmation: string }) => adminResetPasswordById(userId, payload)
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

// Nuevo hook para obtener perfil por id
export function useProfileById(id: string | number) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      const raw = response.data;
      // Derivar role numérico desde raw.role (numérico) o role_relation.nombre (string)
      const roleNumeric = typeof raw.role === 'number' ? raw.role : (() => {
        const nombre = raw?.role_relation?.nombre?.toLowerCase?.();
        if (nombre === 'administrador') return 3;
        if (nombre === 'emprendedor') return 2;
        return 1;
      })();

      const dto = {
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
      } as any;

      // Map to our UI model; interests/favorites tolerance
      return mapProfileDTO(dto, [], []);
    },
    enabled: !!id
  });
}

export function useUpdateProfileById(userId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => updateProfileById(userId, mapToProfileDTO(profile)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    }
  });
}

export function useUploadAvatarById(userId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageData: string) => uploadAvatarById(userId, imageData),
    onSuccess: (data: { avatarUrl: string }) => {
      // Actualizar el avatar en el cache del perfil específico
      queryClient.setQueryData<UserProfile>(['profile', userId], (old) => 
        old ? { ...old, avatarUrl: data.avatarUrl } : old
      );
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
