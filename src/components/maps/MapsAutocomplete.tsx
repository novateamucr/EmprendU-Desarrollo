import React, { useEffect, useRef } from 'react';

// Simple Google Maps JS API loader
function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
    return Promise.resolve((window as any).google as any);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).google));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.onload = () => resolve((window as any).google as any);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export type MapsSelection = {
  formatted?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
};

type Props = {
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSelect: (selection: MapsSelection) => void;
  className?: string;
};

const MapsAutocomplete: React.FC<Props> = ({ value, placeholder, onChange, onSelect, className }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (!apiKey) return; // no key, keep it as normal input
    let autocomplete: any = null;
    loadGoogleMaps(apiKey)
      .then((g: any) => {
        if (!inputRef.current) return;
        autocomplete = new g.maps.places.Autocomplete(inputRef.current!, {
          fields: ['formatted_address', 'geometry', 'place_id', 'name'],
          types: ['geocode', 'establishment'],
        });
        autocomplete.addListener('place_changed', () => {
          if (!autocomplete) return;
          const place = autocomplete.getPlace();
          const formatted = place.formatted_address || place.name || undefined;
          const placeId = place.place_id || undefined;
          const lat = typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : undefined;
          const lng = typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : undefined;
          onSelect({ formatted, placeId, lat: typeof lat === 'number' ? lat : undefined, lng: typeof lng === 'number' ? lng : undefined });
        });
      })
      .catch(() => {
        // silently ignore loader errors; input will behave as normal text input
      });

    return () => {
      // no cleanup necessary for autocomplete instance
    };
  }, [apiKey, onSelect]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={className}
      type="text"
      autoComplete="off"
    />
  );
};

export default MapsAutocomplete;
