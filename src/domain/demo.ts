export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

export function ensureDemoSeed() {
  if (!isDemoMode()) return;
  
  if (!localStorage.getItem('demo_profile')) {
    localStorage.setItem('demo_profile', JSON.stringify({
      id: 2568,
      name: 'Juan Fallas',
      username: 'JuanFallas2568',
      role: 'comprador',
      email: 'nombre@ejemplo.com',
      phone: '+506 0000 0000',
      location: { 
        province: 'San José', 
        canton: 'Hatillo', 
        district: 'Merced', 
        address: '200m norte del parque' 
      },
      avatar_url: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg'
    }));
  }
  
  if (!localStorage.getItem('demo_interests')) {
    localStorage.setItem('demo_interests', JSON.stringify(['Comida', 'Joyería', 'Ropa', 'Arte']));
  }
  
  if (!localStorage.getItem('demo_favorites')) {
    localStorage.setItem('demo_favorites', JSON.stringify([
      { 
        id: 1, 
        entrepreneurship_id: 101,
        name: 'Panadería Alma', 
        category: 'comida', 
        image_url: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=300',
        link: '/emprendimientos/101',
        created_at: '2024-01-15T10:30:00Z'
      },
      { 
        id: 2, 
        entrepreneurship_id: 102,
        name: 'Bisutería La Abuelita', 
        category: 'joyeria', 
        image_url: 'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=300',
        link: '/emprendimientos/102',
        created_at: '2024-01-20T14:15:00Z'
      }
    ]));
  }
}
