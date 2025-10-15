import { MessageCircle, Instagram, Facebook, Linkedin, Phone, Link as LinkIcon, MapPin, Globe, Youtube, ShoppingBag, Twitter } from 'lucide-react';

export type PlatformCode =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'phone'
  | 'linkhub'
  | 'maps'
  | 'website'
  | 'youtube'
  | 'pinterest'
  | 'shop'
  | 'tiktok'
  | 'x'
  | 'email'
  | 'behance';

export const PLATFORM_LABELS: Record<PlatformCode, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  phone: 'Teléfono',
  linkhub: 'Linktree/Beacons',
  maps: 'Google Maps',
  website: 'Website',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  shop: 'Tienda Online',
  tiktok: 'TikTok',
  x: 'X (Twitter)',
  email: 'Email',
  behance: 'Behance',
};

export const PLATFORM_ICONS: Record<PlatformCode, any> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  phone: Phone,
  linkhub: LinkIcon,
  maps: MapPin,
  website: Globe,
  youtube: Youtube,
  pinterest: LinkIcon,
  shop: ShoppingBag,
  tiktok: LinkIcon,
  x: Twitter,
  email: LinkIcon,
  behance: LinkIcon,
};

export type WhatsAppParts = {
  countryCode?: string;
  phone?: string;
  message?: string;
};

export function buildWhatsAppUrl(parts: WhatsAppParts): string {
  const cc = (parts.countryCode ?? '506').replace(/[^\d]/g, '');
  const ph = (parts.phone || '').replace(/[^\d]/g, '');
  const num = `${cc}${ph}`;
  const base = `https://wa.me/${num}`;
  const msg = parts.message ? `?text=${encodeURIComponent(parts.message)}` : '';
  return base + msg;
}

// Google Maps helpers
export type MapsParts = {
  query?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
};

export function buildMapsUrl(parts: MapsParts): string {
  // Prefer coordinates or placeId, else query text
  if (typeof parts.lat === 'number' && typeof parts.lng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.lat + ',' + parts.lng)}`;
  }
  if (parts.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(parts.placeId)}`;
  }
  const q = (parts.query || '').trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function parseMapsUrl(url?: string | null): MapsParts {
  if (!url) return {};
  try {
    const u = new URL(url);
    const hostOk = u.hostname.includes('google.') && u.pathname.includes('/maps');
    if (!hostOk) return { query: url };
    const qp = u.searchParams;
    const query = qp.get('query') || undefined;
    const queryPlaceId = qp.get('query_place_id') || undefined;
    // Try to detect lat,lng in query
    if (query && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query)) {
      const [latStr, lngStr] = query.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    }
    if (queryPlaceId) return { query: query || undefined, placeId: queryPlaceId };
    return { query: query || undefined };
  } catch {
    return {};
  }
}

export function parseWhatsAppUrl(url?: string | null): WhatsAppParts {
  if (!url) return {};
  try {
    const u = new URL(url);
    if (!u.hostname.includes('wa.me')) return {};
    const path = u.pathname.replace(/\//g, '');
    const full = path.replace(/[^\d]/g, '');
    let countryCode = '', phone = '';
    if (full.length > 0) {
      // Prefer a split with 8-digit local phone (e.g., CR: +506 + 8 digits)
      const preferLocal8 = 8;
      if (full.length > preferLocal8) {
        const ccLen8 = full.length - preferLocal8; // 1..3 typical
        if (ccLen8 >= 1 && ccLen8 <= 3) {
          countryCode = full.slice(0, ccLen8);
          phone = full.slice(ccLen8);
        }
      }
      // If not assigned, try a 9-digit local phone split
      if (!phone && full.length > 9) {
        const ccLen9 = full.length - 9;
        if (ccLen9 >= 1 && ccLen9 <= 3) {
          countryCode = full.slice(0, ccLen9);
          phone = full.slice(ccLen9);
        }
      }
      // Fallback: default to 2-digit cc if still empty and length > 2
      if (!phone && full.length > 2) {
        countryCode = full.slice(0, 2);
        phone = full.slice(2);
      }
      // Final fallback: if still empty, treat everything as phone
      if (!phone) {
        phone = full;
      }
    }
    const message = u.searchParams.get('text') || undefined;
    return { countryCode, phone, message };
  } catch {
    return {};
  }
}

export function nextOrder(baseList: Array<{ display_order?: number }>): number {
  const orders = baseList.map((c) => c.display_order ?? 0).filter((n) => n >= 10);
  if (orders.length === 0) return 10;
  return Math.max(...orders) + 10;
}

export function sortChannels<T extends { display_order?: number; is_primary?: boolean; id?: number }>(
  items: T[],
): T[] {
  return [...items]
    .sort((a, b) => {
      const ao = a.display_order ?? 0;
      const bo = b.display_order ?? 0;
      if (ao !== bo) return ao - bo;
      const ap = a.is_primary ? 1 : 0;
      const bp = b.is_primary ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (a.id || 0) - (b.id || 0);
    });
}

// Email helpers: parse Gmail compose URL or mailto into parts for editing
export type EmailParts = { to?: string; body?: string };

export function parseEmailUrl(url?: string | null): EmailParts {
  if (!url) return {};
  try {
    // Handle mailto: links
    if (url.startsWith('mailto:')) {
      const mailto = url.replace(/^mailto:/, '');
      const [addrPart, queryPart] = mailto.split('?');
      const to = addrPart || undefined;
      if (!queryPart) return { to };
      const params = new URLSearchParams(queryPart);
      const body = params.get('body') || undefined;
      return { to, body };
    }
    // Handle Gmail compose links
    const u = new URL(url);
    const isGmailCompose = u.hostname.includes('mail.google.') && u.searchParams.get('view') === 'cm';
    if (!isGmailCompose) return {};
    const to = u.searchParams.get('to') || undefined;
    const body = u.searchParams.get('body') || undefined;
    return { to, body };
  } catch {
    return {};
  }
}
