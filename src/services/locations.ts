// Datos estáticos de Costa Rica - Muestra representativa
const STATIC_LOCATIONS = {
  provincias: [
    { id: 1, nombre: 'San José' },
    { id: 2, nombre: 'Alajuela' },
    { id: 3, nombre: 'Cartago' },
    { id: 4, nombre: 'Heredia' },
    { id: 5, nombre: 'Guanacaste' },
    { id: 6, nombre: 'Puntarenas' },
    { id: 7, nombre: 'Limón' }
  ],
  cantones: {
    'San José': [
      { id: 1, nombre: 'San José', provincia: 'San José' },
      { id: 2, nombre: 'Escazú', provincia: 'San José' },
      { id: 3, nombre: 'Desamparados', provincia: 'San José' },
      { id: 4, nombre: 'Puriscal', provincia: 'San José' },
      { id: 5, nombre: 'Tarrazú', provincia: 'San José' },
      { id: 6, nombre: 'Aserrí', provincia: 'San José' },
      { id: 7, nombre: 'Mora', provincia: 'San José' },
      { id: 8, nombre: 'Goicoechea', provincia: 'San José' },
      { id: 9, nombre: 'Santa Ana', provincia: 'San José' },
      { id: 10, nombre: 'Alajuelita', provincia: 'San José' },
      { id: 11, nombre: 'Vázquez de Coronado', provincia: 'San José' },
      { id: 12, nombre: 'Acosta', provincia: 'San José' },
      { id: 13, nombre: 'Tibás', provincia: 'San José' },
      { id: 14, nombre: 'Moravia', provincia: 'San José' },
      { id: 15, nombre: 'Montes de Oca', provincia: 'San José' },
      { id: 16, nombre: 'Turrubares', provincia: 'San José' },
      { id: 17, nombre: 'Dota', provincia: 'San José' },
      { id: 18, nombre: 'Curridabat', provincia: 'San José' },
      { id: 19, nombre: 'Pérez Zeledón', provincia: 'San José' },
      { id: 20, nombre: 'León Cortés Castro', provincia: 'San José' }
    ],
    'Alajuela': [
      { id: 21, nombre: 'Alajuela', provincia: 'Alajuela' },
      { id: 22, nombre: 'San Ramón', provincia: 'Alajuela' },
      { id: 23, nombre: 'Grecia', provincia: 'Alajuela' },
      { id: 24, nombre: 'San Mateo', provincia: 'Alajuela' },
      { id: 25, nombre: 'Atenas', provincia: 'Alajuela' },
      { id: 26, nombre: 'Naranjo', provincia: 'Alajuela' },
      { id: 27, nombre: 'Palmares', provincia: 'Alajuela' },
      { id: 28, nombre: 'Poás', provincia: 'Alajuela' },
      { id: 29, nombre: 'Orotina', provincia: 'Alajuela' },
      { id: 30, nombre: 'San Carlos', provincia: 'Alajuela' },
      { id: 31, nombre: 'Zarcero', provincia: 'Alajuela' },
      { id: 32, nombre: 'Valverde Vega', provincia: 'Alajuela' },
      { id: 33, nombre: 'Upala', provincia: 'Alajuela' },
      { id: 34, nombre: 'Los Chiles', provincia: 'Alajuela' },
      { id: 35, nombre: 'Guatuso', provincia: 'Alajuela' }
    ],
    'Cartago': [
      { id: 36, nombre: 'Cartago', provincia: 'Cartago' },
      { id: 37, nombre: 'Paraíso', provincia: 'Cartago' },
      { id: 38, nombre: 'La Unión', provincia: 'Cartago' },
      { id: 39, nombre: 'Jiménez', provincia: 'Cartago' },
      { id: 40, nombre: 'Turrialba', provincia: 'Cartago' },
      { id: 41, nombre: 'Alvarado', provincia: 'Cartago' },
      { id: 42, nombre: 'Oreamuno', provincia: 'Cartago' },
      { id: 43, nombre: 'El Guarco', provincia: 'Cartago' }
    ],
    'Heredia': [
      { id: 44, nombre: 'Heredia', provincia: 'Heredia' },
      { id: 45, nombre: 'Barva', provincia: 'Heredia' },
      { id: 46, nombre: 'Santo Domingo', provincia: 'Heredia' },
      { id: 47, nombre: 'Santa Bárbara', provincia: 'Heredia' },
      { id: 48, nombre: 'San Rafael', provincia: 'Heredia' },
      { id: 49, nombre: 'San Isidro', provincia: 'Heredia' },
      { id: 50, nombre: 'Belén', provincia: 'Heredia' },
      { id: 51, nombre: 'Flores', provincia: 'Heredia' },
      { id: 52, nombre: 'San Pablo', provincia: 'Heredia' },
      { id: 53, nombre: 'Sarapiquí', provincia: 'Heredia' }
    ],
    'Guanacaste': [
      { id: 54, nombre: 'Liberia', provincia: 'Guanacaste' },
      { id: 55, nombre: 'Nicoya', provincia: 'Guanacaste' },
      { id: 56, nombre: 'Santa Cruz', provincia: 'Guanacaste' },
      { id: 57, nombre: 'Bagaces', provincia: 'Guanacaste' },
      { id: 58, nombre: 'Carrillo', provincia: 'Guanacaste' },
      { id: 59, nombre: 'Cañas', provincia: 'Guanacaste' },
      { id: 60, nombre: 'Abangares', provincia: 'Guanacaste' },
      { id: 61, nombre: 'Tilarán', provincia: 'Guanacaste' },
      { id: 62, nombre: 'Nandayure', provincia: 'Guanacaste' },
      { id: 63, nombre: 'La Cruz', provincia: 'Guanacaste' },
      { id: 64, nombre: 'Hojancha', provincia: 'Guanacaste' }
    ],
    'Puntarenas': [
      { id: 65, nombre: 'Puntarenas', provincia: 'Puntarenas' },
      { id: 66, nombre: 'Esparza', provincia: 'Puntarenas' },
      { id: 67, nombre: 'Buenos Aires', provincia: 'Puntarenas' },
      { id: 68, nombre: 'Montes de Oro', provincia: 'Puntarenas' },
      { id: 69, nombre: 'Osa', provincia: 'Puntarenas' },
      { id: 70, nombre: 'Quepos', provincia: 'Puntarenas' },
      { id: 71, nombre: 'Golfito', provincia: 'Puntarenas' },
      { id: 72, nombre: 'Coto Brus', provincia: 'Puntarenas' },
      { id: 73, nombre: 'Parrita', provincia: 'Puntarenas' },
      { id: 74, nombre: 'Corredores', provincia: 'Puntarenas' },
      { id: 75, nombre: 'Garabito', provincia: 'Puntarenas' }
    ],
    'Limón': [
      { id: 76, nombre: 'Limón', provincia: 'Limón' },
      { id: 77, nombre: 'Pococí', provincia: 'Limón' },
      { id: 78, nombre: 'Siquirres', provincia: 'Limón' },
      { id: 79, nombre: 'Talamanca', provincia: 'Limón' },
      { id: 80, nombre: 'Matina', provincia: 'Limón' },
      { id: 81, nombre: 'Guácimo', provincia: 'Limón' }
    ]
  },
  distritos: {
    'San José': [
      { id: 1, nombre: 'Carmen', provincia: 'San José', canton: 'San José' },
      { id: 2, nombre: 'Merced', provincia: 'San José', canton: 'San José' },
      { id: 3, nombre: 'Hospital', provincia: 'San José', canton: 'San José' },
      { id: 4, nombre: 'Catedral', provincia: 'San José', canton: 'San José' },
      { id: 5, nombre: 'Zapote', provincia: 'San José', canton: 'San José' },
      { id: 6, nombre: 'San Francisco de Dos Ríos', provincia: 'San José', canton: 'San José' },
      { id: 7, nombre: 'La Uruca', provincia: 'San José', canton: 'San José' },
      { id: 8, nombre: 'Mata Redonda', provincia: 'San José', canton: 'San José' },
      { id: 9, nombre: 'Pavas', provincia: 'San José', canton: 'San José' },
      { id: 10, nombre: 'Hatillo', provincia: 'San José', canton: 'San José' },
      { id: 11, nombre: 'San Sebastián', provincia: 'San José', canton: 'San José' }
    ],
    'Escazú': [
      { id: 12, nombre: 'Escazú', provincia: 'San José', canton: 'Escazú' },
      { id: 13, nombre: 'San Antonio', provincia: 'San José', canton: 'Escazú' },
      { id: 14, nombre: 'San Rafael', provincia: 'San José', canton: 'Escazú' }
    ],
    'Desamparados': [
      { id: 15, nombre: 'Desamparados', provincia: 'San José', canton: 'Desamparados' },
      { id: 16, nombre: 'San Miguel', provincia: 'San José', canton: 'Desamparados' },
      { id: 17, nombre: 'San Juan de Dios', provincia: 'San José', canton: 'Desamparados' },
      { id: 18, nombre: 'San Rafael Arriba', provincia: 'San José', canton: 'Desamparados' },
      { id: 19, nombre: 'San Antonio', provincia: 'San José', canton: 'Desamparados' }
    ],
    'Alajuela': [
      { id: 20, nombre: 'Alajuela', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 21, nombre: 'San José', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 22, nombre: 'Carrizal', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 23, nombre: 'San Antonio', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 24, nombre: 'Guácima', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 25, nombre: 'San Isidro', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 26, nombre: 'Sabanilla', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 27, nombre: 'San Rafael', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 28, nombre: 'Río Segundo', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 29, nombre: 'Desamparados', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 30, nombre: 'Turrúcares', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 31, nombre: 'Tambor', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 32, nombre: 'Garita', provincia: 'Alajuela', canton: 'Alajuela' },
      { id: 33, nombre: 'Sarapiquí', provincia: 'Alajuela', canton: 'Alajuela' }
    ],
    'Cartago': [
      { id: 34, nombre: 'Oriental', provincia: 'Cartago', canton: 'Cartago' },
      { id: 35, nombre: 'Occidental', provincia: 'Cartago', canton: 'Cartago' },
      { id: 36, nombre: 'Carmen', provincia: 'Cartago', canton: 'Cartago' },
      { id: 37, nombre: 'San Nicolás', provincia: 'Cartago', canton: 'Cartago' },
      { id: 38, nombre: 'Agua Caliente', provincia: 'Cartago', canton: 'Cartago' },
      { id: 39, nombre: 'Guadalupe', provincia: 'Cartago', canton: 'Cartago' },
      { id: 40, nombre: 'Corralillo', provincia: 'Cartago', canton: 'Cartago' },
      { id: 41, nombre: 'Tierra Blanca', provincia: 'Cartago', canton: 'Cartago' },
      { id: 42, nombre: 'Dulce Nombre', provincia: 'Cartago', canton: 'Cartago' },
      { id: 43, nombre: 'Llano Grande', provincia: 'Cartago', canton: 'Cartago' },
      { id: 44, nombre: 'Quebradilla', provincia: 'Cartago', canton: 'Cartago' }
    ],
    'Liberia': [
      { id: 45, nombre: 'Liberia', provincia: 'Guanacaste', canton: 'Liberia' },
      { id: 46, nombre: 'Cañas Dulces', provincia: 'Guanacaste', canton: 'Liberia' },
      { id: 47, nombre: 'Mayorga', provincia: 'Guanacaste', canton: 'Liberia' },
      { id: 48, nombre: 'Nacascolo', provincia: 'Guanacaste', canton: 'Liberia' },
      { id: 49, nombre: 'Curubandé', provincia: 'Guanacaste', canton: 'Liberia' }
    ],
    'Limón': [
      { id: 50, nombre: 'Limón', provincia: 'Limón', canton: 'Limón' },
      { id: 51, nombre: 'Valle La Estrella', provincia: 'Limón', canton: 'Limón' },
      { id: 52, nombre: 'Río Blanco', provincia: 'Limón', canton: 'Limón' },
      { id: 53, nombre: 'Matama', provincia: 'Limón', canton: 'Limón' }
    ]
  }
};

export interface LocationData {
  provincia: string;
  canton: string;
  distrito: string;
}

export interface ApiLocation {
  id: number;
  nombre: string;
}

export interface ApiCanton extends ApiLocation {
  provincia: string;
}

export interface ApiDistrito extends ApiLocation {
  provincia: string;
  canton: string;
}

// Cache para evitar múltiples requests
let locationsCache: {
  provincias?: ApiLocation[];
  cantones?: ApiCanton[];
  distritos?: ApiDistrito[];
} = {};

export async function getProvincias(): Promise<ApiLocation[]> {
  if (locationsCache.provincias) {
    return locationsCache.provincias;
  }

  // Usar datos estáticos directamente
  const data = STATIC_LOCATIONS.provincias;
  locationsCache.provincias = data;
  return data;
}

export async function getCantones(provincia?: string): Promise<ApiCanton[]> {
  if (!provincia) return [];

  // Usar datos estáticos directamente
  const cantonesForProvincia = STATIC_LOCATIONS.cantones[provincia as keyof typeof STATIC_LOCATIONS.cantones] || [];
  return cantonesForProvincia;
}

export async function getDistritos(provincia?: string, canton?: string): Promise<ApiDistrito[]> {
  if (!provincia || !canton) return [];

  // Usar datos estáticos directamente
  const distritosForCanton = STATIC_LOCATIONS.distritos[canton as keyof typeof STATIC_LOCATIONS.distritos] || [];
  return distritosForCanton;
}
