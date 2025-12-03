export type Rol = 'comprador' | 'emprendedor';

export interface Ubicacion {
  provincia?: string;
  canton?: string;
  distrito?: string;
  direccionBreve?: string;
}

export interface AdditionalLocation {
  id: number;
  user_id: number;
  provincia: string;
  canton: string;
  distrito: string;
  direccion_breve: string;
  created_at?: string;
  updated_at?: string;
}

export interface Favorito {
  id: string;
  nombre: string;
  categoria: 'comida' | 'joyeria' | 'ropa' | 'arte' | 'otro';
  imgUrl: string;
}

export interface User {
  nombre: string;
  username: string;
  rol: Rol;
  email: string;
  telefono?: string;
  ubicacion: Ubicacion;
  intereses: string[];
  favoritos: Favorito[];
  avatarUrl?: string;
}
