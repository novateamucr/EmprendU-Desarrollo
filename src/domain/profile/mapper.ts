import { ProfileDTO, FavoritesDTO, InterestsDTO } from './dto';
import { UserProfile, Favorito } from './types';

export const mapProfileDTO = (
  dto: ProfileDTO, 
  interestsDTO: InterestsDTO['interests'] = [], 
  favorites: Favorito[] = []
): UserProfile => ({
  id: dto.id,
  name: dto.name,
  username: dto.username,
  role: dto.role,
  email: dto.email,
  phone: dto.phone,
  location: dto.location ?? {},
  avatarUrl: dto.avatar_url,
  interests: interestsDTO,
  favorites,
});

export const mapFavoritesDTO = (dto: FavoritesDTO): Favorito[] =>
  dto.favorites.map(f => ({
    id: f.id,
    entrepreneurship_id: f.entrepreneurship_id,
    name: f.name,
    imageUrl: f.image_url,
    link: f.link,
    category: (f.category as any) ?? 'otro',
    created_at: f.created_at
  }));

export const mapToProfileDTO = (profile: Partial<UserProfile>): Partial<ProfileDTO> => ({
  name: profile.name,
  username: profile.username,
  role: profile.role,
  email: profile.email,
  phone: profile.phone,
  location: profile.location,
  avatar_url: profile.avatarUrl,
});
