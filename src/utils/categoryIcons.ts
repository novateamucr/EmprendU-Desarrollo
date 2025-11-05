// Centralized mapping from category name to icon URL (Iconify), with fallback.
// Usage: categoryIconUrl('Comida') -> svg URL

export function removeAccents(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const ICON_MAP: Record<string, string> = {
  comida: 'mdi:food',
  alimentos: 'mdi:food',
  bebidas: 'mdi:cup',
  joyeria: 'mdi:diamond-stone',
  joyería: 'mdi:diamond-stone',
  ropa: 'mdi:tshirt-crew',
  arte: 'mdi:palette',
  tecnologia: 'mdi:laptop',
  tecnología: 'mdi:laptop',
  deportes: 'mdi:dumbbell',
  musica: 'mdi:music',
  música: 'mdi:music',
  libros: 'mdi:book-open-page-variant',
  belleza: 'mdi:lipstick',
  hogar: 'mdi:home-outline',
  mascotas: 'mdi:paw',
  servicios: 'mdi:briefcase-account',
  salud: 'mdi:heart-pulse',
  artesanias: 'mdi:hand-heart',
  artesanías: 'mdi:hand-heart',
  papeleria: 'mdi:notebook',
  papelería: 'mdi:notebook',
  accesorios: 'mdi:watch',
  entretenimiento: 'mdi:movie-open',
  ninos: 'mdi:human-child',
  niños: 'mdi:human-child',
  'mis intereses': 'mdi:star',
  todos: 'mdi:menu',
};

const DEFAULT_ICON = 'mdi:tag-outline';
// Default color for unselected icons should match Tailwind's brandDark
const BRAND_COLOR = '#5b98b8';

export function categoryIconUrl(name: string, color: string = BRAND_COLOR): string {
  const key = removeAccents(name);
  // Exact match
  if (ICON_MAP[key]) {
    return `https://api.iconify.design/${encodeURIComponent(ICON_MAP[key])}.svg?color=${encodeURIComponent(color)}`;
  }
  // Heuristics: simple contains
  if (key.includes('comida') || key.includes('alimento')) return categoryIconUrl('comida');
  if (key.includes('bebi')) return categoryIconUrl('bebidas');
  if (key.includes('joy')) return categoryIconUrl('joyeria');
  if (key.includes('rop')) return categoryIconUrl('ropa');
  if (key.includes('art')) return categoryIconUrl('arte');
  if (key.includes('tecno')) return categoryIconUrl('tecnologia');
  if (key.includes('deport')) return categoryIconUrl('deportes');
  if (key.includes('music')) return categoryIconUrl('musica');
  if (key.includes('libro')) return categoryIconUrl('libros');
  if (key.includes('bellez')) return categoryIconUrl('belleza');
  if (key.includes('hogar') || key.includes('casa')) return categoryIconUrl('hogar');
  if (key.includes('mascot') || key.includes('pet')) return categoryIconUrl('mascotas');
  if (key.includes('servi')) return categoryIconUrl('servicios');
  if (key.includes('salud')) return categoryIconUrl('salud');
  if (key.includes('artesan')) return categoryIconUrl('artesanias');
  if (key.includes('papeler')) return categoryIconUrl('papeleria');
  if (key.includes('accesor')) return categoryIconUrl('accesorios');
  if (key.includes('entreten')) return categoryIconUrl('entretenimiento');
  if (key.includes('niñ') || key.includes('nino')) return categoryIconUrl('ninos');

  // Fallback
  return `https://api.iconify.design/${encodeURIComponent(DEFAULT_ICON)}.svg?color=${encodeURIComponent(color)}`;
}

// Centralized color map for categories. These are base HEX colors used across the app.
const COLOR_MAP: Record<string, string> = {
  comida: '#059669', // green (emerald)
  alimentos: '#059669',
  bebidas: '#0EA5A4', // teal
  belleza: '#DB2777', // pink
  joyeria: '#F97316', // orange
  ropa: '#2563EB', // blue
  arte: '#7C3AED', // violet
  tecnologia: '#0EA5FF', // light blue
  deportes: '#16A34A', // green
  musica: '#EF4444', // red
  libros: '#F59E0B', // amber
  hogar: '#64748B', // slate
  mascotas: '#0EA5A4',
  servicios: '#374151', // gray-700
  salud: '#DC2626',
  artesanias: '#D97706',
  papeleria: '#06B6D4',
  accesorios: '#F43F5E',
  entretenimiento: '#8B5CF6',
  ninos: '#F97316',
  'mis intereses': '#D97706',
  todos: '#4F46E5',
};

// Return a HEX color for a given category name. Falls back to a deterministic hashed color
// if the category isn't recognized in COLOR_MAP.
export function categoryColor(name?: string): string {
  if (!name) return COLOR_MAP['todos'];
  const key = removeAccents(name).toLowerCase();
  if (COLOR_MAP[key]) return COLOR_MAP[key];

  // Heuristics similar to icon matching
  if (key.includes('comida') || key.includes('alimento')) return COLOR_MAP['comida'];
  if (key.includes('bebi')) return COLOR_MAP['bebidas'];
  if (key.includes('joy')) return COLOR_MAP['joyeria'];
  if (key.includes('rop')) return COLOR_MAP['ropa'];
  if (key.includes('art')) return COLOR_MAP['arte'];
  if (key.includes('tecno')) return COLOR_MAP['tecnologia'];
  if (key.includes('deport')) return COLOR_MAP['deportes'];
  if (key.includes('music')) return COLOR_MAP['musica'];
  if (key.includes('libro')) return COLOR_MAP['libros'];
  if (key.includes('bellez')) return COLOR_MAP['belleza'];
  if (key.includes('hogar') || key.includes('casa')) return COLOR_MAP['hogar'];
  if (key.includes('mascot') || key.includes('pet')) return COLOR_MAP['mascotas'];
  if (key.includes('servi')) return COLOR_MAP['servicios'];
  if (key.includes('salud')) return COLOR_MAP['salud'];
  if (key.includes('artesan')) return COLOR_MAP['artesanias'];
  if (key.includes('papeler')) return COLOR_MAP['papeleria'];
  if (key.includes('accesor')) return COLOR_MAP['accesorios'];
  if (key.includes('entreten')) return COLOR_MAP['entretenimiento'];

  // Deterministic fallback: hash the name to pick a color from a small palette
  const fallbackColors = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#2563EB', '#EA580C', '#16A34A', '#9333EA'];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % fallbackColors.length;
  return fallbackColors[idx];
}
