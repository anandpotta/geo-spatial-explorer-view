
import { useEffect } from 'react';
import { Map } from 'leaflet';
import '@/types/leaflet-extended.d.ts';

interface MapInitProps {
  map: Map | null;
  hasCalledOnReady: React.MutableRefObject<boolean>;
}

export function useMapInitialization({ map, hasCalledOnReady }: MapInitProps) {
  useEffect(() => {
    if (!map) return;

    const timeouts = [100, 300, 600, 1000].map((delay, i) => 
      setTimeout(() => {
        if (map && !hasCalledOnReady.current) {
          map.invalidateSize(true);
          if (i === 3) {
            console.log('Applied final forced invalidateSize');
          }
        }
      }, delay)
    );
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [map, hasCalledOnReady]);
}
