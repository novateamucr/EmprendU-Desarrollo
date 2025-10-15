import React, { useEffect, useRef, useState } from 'react';

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
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [googleObj, setGoogleObj] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [lat, setLat] = useState<number>(initialLat ?? 9.9281); // San José, CR default
  const [lng, setLng] = useState<number>(initialLng ?? -84.0907);
  const [address, setAddress] = useState<string>(initialAddress || '');
  const [loadingAddr, setLoadingAddr] = useState(false);

  useEffect(() => {
    loadGoogleMaps(apiKey).then((g) => {
      setGoogleObj(g);
      const center = new g.maps.LatLng(lat, lng);
      const m = new g.maps.Map(mapRef.current!, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setMap(m);

      const mk = new g.maps.Marker({
        position: center,
        map: m,
        draggable: true,
      });
      setMarker(mk);

      const gc = new g.maps.Geocoder();
      setGeocoder(gc);

      const updateFromPos = (pos: any) => {
        const ll = pos.latLng || pos;
        const newLat = typeof ll.lat === 'function' ? ll.lat() : ll.lat;
        const newLng = typeof ll.lng === 'function' ? ll.lng() : ll.lng;
        setLat(newLat);
        setLng(newLng);
        if (!gc) return;
        setLoadingAddr(true);
        gc.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
          if (status === 'OK' && results?.length) {
            setAddress(results[0].formatted_address || '');
          }
          setLoadingAddr(false);
        });
      };

      mk.addListener('dragend', (ev: any) => updateFromPos(ev));
      m.addListener('click', (ev: any) => {
        const ll = ev.latLng;
        mk.setPosition(ll);
        updateFromPos(ev);
      });

      // initial reverse geocode if we have no address
      if (!initialAddress && gc) {
        setLoadingAddr(true);
        gc.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results?.length) {
            setAddress(results[0].formatted_address || '');
          }
          setLoadingAddr(false);
        });
      }
    }).catch(() => {
      // if script load fails, we leave picker blank
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <div ref={mapRef} style={{ width: '100%', height }} className="rounded-md overflow-hidden border" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-sm text-gray-600 truncate" title={address}>
          {loadingAddr ? 'Obteniendo dirección…' : (address || 'Selecciona una ubicación en el mapa')}
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
