export interface ProfileDTO {
  id: number;
  name: string;
  username: string;
  role: 'comprador' | 'emprendedor';
  email: string;
  phone?: string;
  location?: { 
    province?: string; 
    canton?: string; 
    district?: string; 
    address?: string;
  };
  avatar_url?: string;
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
