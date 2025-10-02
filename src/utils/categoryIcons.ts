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
