import { ProfileDTO, FavoritesDTO, InterestsDTO } from './dto';
import { UserProfile, Favorito } from './types';

// Mapeo de roles numéricos a strings
const mapRoleFromBackend = (roleId: number, roleRelation?: { name: string }): 'comprador' | 'emprendedor' => {
  if (roleRelation?.name) {
    return roleRelation.name.toLowerCase() === 'emprendedor' ? 'emprendedor' : 'comprador';
  }
  // Fallback basado en ID (ajustar según la estructura real del backend)
  return roleId === 2 ? 'emprendedor' : 'comprador';
};

const mapRoleToBackend = (role: 'comprador' | 'emprendedor'): number => {
  return role === 'emprendedor' ? 2 : 1; // Ajustar según IDs reales del backend
};

export const mapProfileDTO = (
  dto: ProfileDTO, 
  interestsDTO: InterestsDTO['interests'] = [], 
  favorites: Favorito[] = []
): UserProfile => ({
  id: dto.id,
  name: dto.name,
  username: dto.username,
  role: mapRoleFromBackend(dto.role, dto.roleRelation),
  email: dto.email,
  phone: dto.phone,
  location: {
    province: dto.province,
    canton: dto.canton,
    district: dto.district,
    address: dto.address
  },
  avatarUrl: dto.avatar_url,
  interests: dto.interests ? dto.interests.map(i => i.interest) : interestsDTO,
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
  role: profile.role ? mapRoleToBackend(profile.role) : undefined,
  email: profile.email,
  phone: profile.phone,
  province: profile.location?.province,
  canton: profile.location?.canton,
  district: profile.location?.district,
  address: profile.location?.address,
  avatar_url: profile.avatarUrl,
});
