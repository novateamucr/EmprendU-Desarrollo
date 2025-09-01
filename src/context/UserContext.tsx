import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types/user';
import { placeholderImages } from '../assets/placeholders';

interface UserContextType {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  toggleInteres: (interes: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialUser: User = {
  nombre: 'Juan Fallas',
  username: 'juanfallas',
  rol: 'comprador',
  email: 'juan.fallas@email.com',
  telefono: '+506 8888-8888',
  ubicacion: {
    provincia: 'San José',
    canton: 'Central',
    distrito: 'Carmen',
    direccionBreve: 'Avenida Central, 200m norte del Teatro Nacional',
  },
  intereses: ['Comida', 'Joyería', 'Ropa'],
  favoritos: placeholderImages.favoritos,
  avatarUrl: placeholderImages.avatars.default,
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(initialUser);

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const toggleInteres = (interes: string) => {
    setUser(prev => ({
      ...prev,
      intereses: prev.intereses.includes(interes)
        ? prev.intereses.filter(i => i !== interes)
        : [...prev.intereses, interes],
    }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser, toggleInteres }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
