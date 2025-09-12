export interface ProfileDTO {
  id: number;
  name: string;
  username: string;
  role: number; // Laravel backend usa ID numérico del rol
  email: string;
  phone?: string;
  province?: string; // Laravel backend usa campos separados
  canton?: string;
  district?: string;
  address?: string;
  avatar_url?: string;
  banned?: boolean;
  // Relaciones que puede incluir el backend
  roleRelation?: {
    id: number;
    name: string;
  };
  interests?: Array<{
    id: number;
    user_id: number;
    interest: string;
  }>;
  entrepreneurships?: any[];
}

export interface FavoritesDTO { 
  favorites: { 
    id: number; 
    entrepreneurship_id: number;
    name: string; 
    image_url: string;
    link: string;
    category: string; 
    created_at: string;
  }[];
}

export interface InterestsDTO { 
  interests: string[];
}

export interface PasswordUpdateDTO {
  current_password: string;
  password: string;
  password_confirmation: string;
}
