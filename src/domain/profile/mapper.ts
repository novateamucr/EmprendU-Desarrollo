import { ProfileDTO, FavoritesDTO, InterestsDTO } from './dto';
import { UserProfile, Favorito } from './types';

// Mapeo de roles numéricos a strings
type Rol = 'comprador' | 'emprendedor' | 'administrador';

// Backend -> Front (numérico/string a union)
const mapRoleFromBackend = (roleId: number, roleRelation?: { name: string }): Rol => {
  if (roleRelation?.name) {
    const role = roleRelation.name.toLowerCase();
    if (role === 'emprendedor' || role === 'administrador') return role as Rol;
    return 'comprador';
  }
  if (roleId === 3) return 'administrador';
  if (roleId === 2) return 'emprendedor';
  return 'comprador';
};

// Front -> Backend (union a numérico)
export const mapRoleToBackend = (role: Rol): number => {
  if (role === 'administrador') return 3;
  if (role === 'emprendedor') return 2;
  return 1; // comprador
};

// DTO -> Modelo de UI
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
    address: (dto as any).address ?? (dto as any).direccion ?? (dto as any).direccion_breve
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

// UI -> DTO
export const mapToProfileDTO = (profile: Partial<UserProfile>): Partial<ProfileDTO> => ({
  name: profile.name,
  username: profile.username,
  email: profile.email,
  phone: profile.phone,
  // Map string role ('comprador' | 'emprendedor' | 'administrador') to backend numeric id
  ...(profile.role ? { role: mapRoleToBackend(profile.role as any) } : {}),
  province: profile.location?.province,
  canton: profile.location?.canton,
  district: profile.location?.district,
  address: profile.location?.address,
  // Enviar alias para compatibilidad con backends que esperan 'direccion'
  ...(profile.location?.address ? { direccion: profile.location.address } : {}),
  avatar_url: profile.avatarUrl,
});
