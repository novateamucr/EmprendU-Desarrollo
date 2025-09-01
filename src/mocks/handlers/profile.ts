import { http, HttpResponse } from 'msw';

const base = import.meta.env.VITE_API_BASE_URL;

let profile = {
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
  avatar_url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
};

let interests = ['Comida', 'Joyería', 'Ropa', 'Arte'];

let favorites = [
  {
    id: 'fav1',
    name: 'Panadería Alma',
    category: 'comida',
    image_url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=200&q=80'
  },
  {
    id: 'fav2',
    name: 'Bisutería La Abuelita',
    category: 'joyeria',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=80'
  },
  {
    id: 'fav3',
    name: 'Dulce Postrecito',
    category: 'comida',
    image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=80'
  },
  {
    id: 'fav4',
    name: 'Pink Diamond',
    category: 'joyeria',
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&q=80'
  }
];

export const profileHandlers = [
  http.get(`${base}/profile`, () => {
    return HttpResponse.json(profile);
  }),

  http.put(`${base}/profile`, async ({ request }) => {
    const body = await request.json() as any;
    profile = { ...profile, ...body };
    return HttpResponse.json(profile);
  }),

  http.put(`${base}/profile/password`, async ({ request }) => {
    const payload = await request.json() as any;
    console.log('Password update payload:', payload);
    
    // Simulate password validation
    if (!payload.current_password) {
      return HttpResponse.json(
        { message: 'Current password is required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ message: 'Password updated successfully' });
  }),

  http.get(`${base}/profile/interests`, () => {
    return HttpResponse.json({ interests });
  }),

  http.put(`${base}/profile/interests`, async ({ request }) => {
    const body = await request.json() as any;
    interests = body.interests ?? interests;
    return HttpResponse.json({ interests });
  }),

  http.get(`${base}/profile/favorites`, () => {
    return HttpResponse.json({ favorites });
  }),

  http.post(`${base}/profile/avatar`, async ({ request }) => {
    const payload = await request.json() as any;
    console.log('Avatar upload payload received');
    
    // Simulate image processing and return new URL
    const newAvatarUrl = `data:image/jpeg;base64,${payload.image.split(',')[1]}`;
    
    // Update mock data
    profile.avatar_url = newAvatarUrl;
    
    return HttpResponse.json({ 
      avatarUrl: newAvatarUrl,
      message: 'Avatar uploaded successfully' 
    });
  })
];
