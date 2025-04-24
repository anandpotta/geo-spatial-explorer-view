
import { useCallback, useEffect, useState } from 'react';
import L from 'leaflet';

export function useLeafletSetup(onMapReady?: (map: L.Map) => void) {
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());

  // Cleanup function to properly remove the map instance
  const cleanupMap = useCallback((mapRef: React.MutableRefObject<L.Map | null>) => {
    if (mapRef.current) {
      console.log('Cleaning up Leaflet map instance');
      try {
        try {
          const container = mapRef.current.getContainer();
          if (container && container.parentNode) {
            mapRef.current.remove();
            container.classList.remove('leaflet-container-reused');
          }
        } catch (e) {
          console.log('Map container already removed');
        }
      } catch (err) {
        console.error('Error cleaning up map:', err);
      }
      mapRef.current = null;
    }
  }, []);

  // Setup Leaflet CSS
  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      console.log('Adding Leaflet CSS');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (!document.querySelector('link[href*="leaflet.draw.css"]')) {
      console.log('Adding Leaflet Draw CSS');
      const drawLink = document.createElement('link');
      drawLink.rel = 'stylesheet';
      drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
      document.head.appendChild(drawLink);
    }
  }, []);

  return {
    mapInstanceKey,
    setMapInstanceKey,
    cleanupMap
  };
}
