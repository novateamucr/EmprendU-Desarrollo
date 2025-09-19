import { ProfileDTO, FavoritesDTO, InterestsDTO } from './dto';
import { UserProfile, Favorito } from './types';

// Mapeo de roles numéricos a strings
type Rol = 'cliente' | 'emprendedor' | 'administrador';

const mapRoleFromBackend = (roleId: number, roleRelation?: { name: string }): Rol => {
  if (roleRelation?.name) {
    const role = roleRelation.name.toLowerCase();
    if (role === 'emprendedor' || role === 'administrador') {
      return role;
    }
    return 'cliente';
  }
  // Mapeo de ID de rol a nombre de rol (3: Admin, 2: Emprendedor, 1: Cliente)
  if (roleId === 3) return 'administrador';
  if (roleId === 2) return 'emprendedor';
  return 'cliente';
};

const mapRoleToBackend = (role: 'cliente' | 'emprendedor' | 'administrador'): number => {
  if (role === 'administrador') return 3;
  if (role === 'emprendedor') return 2;
  return 1; // Default to client
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
