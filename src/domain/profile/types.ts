export type Rol = 'comprador' | 'emprendedor';

export interface Ubicacion {
  province?: string;
  canton?: string;
  district?: string;
  address?: string;
}

export interface Favorito {
  id: number;
  entrepreneurship_id: number;
  name: string;
  imageUrl: string;
  link: string;
  category: 'comida' | 'joyeria' | 'ropa' | 'arte' | 'otro';
  created_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  role: Rol;
  email: string;
  phone?: string;
  location: Ubicacion;
  avatarUrl?: string;
  interests: string[];
  favorites: Favorito[];
}
