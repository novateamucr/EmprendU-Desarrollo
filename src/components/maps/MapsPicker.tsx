import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
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
    const apiKeyParam = apiKey ? `key=${encodeURIComponent(apiKey)}&` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?${apiKeyParam}libraries=places`;
    script.onload = () => resolve((window as any).google as any);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export type MapPicked = {
  lat: number;
  lng: number;
  address: string;
};

type Props = {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  height?: number;
  onConfirm: (picked: MapPicked) => void;
  className?: string;
};

const MapsPicker: React.FC<Props> = ({ initialLat, initialLng, initialAddress, height = 220, onConfirm, className }) => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [googleMaps, setGoogleMaps] = useState<any>(null);
  const markerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [lat, setLat] = useState<number>(initialLat ?? 9.9281); // San José, CR default
  const [lng, setLng] = useState<number>(initialLng ?? -84.0907);
  const [address, setAddress] = useState<string>(initialAddress || '');

  useEffect(() => {
    loadGoogleMaps(apiKey).then((g) => {
      if (!g) return;
      
      const googleMapsInstance = g.maps;
      setGoogleMaps(googleMapsInstance);

      if (!mapContainerRef.current) return;
      
      const mapInstance = new googleMapsInstance.Map(mapContainerRef.current, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
      });

      mapInstanceRef.current = mapInstance;
      geocoderRef.current = new googleMapsInstance.Geocoder();

      markerRef.current = new googleMapsInstance.Marker({
        position: { lat, lng },
        map: mapInstance,
        draggable: true,
      });

      const updateFromPos = (pos: any) => {
        const ll = pos.latLng || pos;
        const newLat = typeof ll.lat === 'function' ? ll.lat() : ll.lat;
        const newLng = typeof ll.lng === 'function' ? ll.lng() : ll.lng;
        setLat(newLat);
        setLng(newLng);
        if (!geocoderRef.current) return;
        geocoderRef.current.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      };

      markerRef.current.addListener('dragend', (ev: any) => updateFromPos(ev));
      mapInstance.addListener('click', (ev: any) => {
        const ll = ev.latLng;
        markerRef.current.setPosition(ll);
        updateFromPos(ev);
      });

      // initial reverse geocode if we have no address
      if (googleMaps && mapInstanceRef.current && markerRef.current && geocoderRef.current) {
        mapInstanceRef.current.panTo({ lat, lng });
        markerRef.current.setPosition({ lat, lng });

        geocoderRef.current.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      }
    }).catch(() => {
      // if script load fails, we leave picker blank
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <div ref={mapContainerRef} style={{ width: '100%', height: `${height}px` }} className="rounded-md overflow-hidden border" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-sm text-gray-600 truncate" title={address}>
          {address || 'Selecciona una ubicación en el mapa'}
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded bg-sky-600 text-white text-sm hover:bg-sky-700"
          onClick={() => {
            if (typeof lat === 'number' && typeof lng === 'number') {
              onConfirm({ lat, lng, address });
            }
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default MapsPicker;
