
import { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import { getSavedMarkers } from '@/utils/marker-utils';

export function useMapInitialization(selectedLocation?: { x: number, y: number }) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  
  useEffect(() => {
    setupLeafletIcons();
    
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        
        try {
          if (mapRef.current && mapRef.current.remove) {
            try {
              const container = mapRef.current.getContainer();
              if (container && document.body.contains(container)) {
                console.log('Map container exists and is attached - removing map instance');
                mapRef.current.remove();
              }
            } catch (e) {
              console.log('Map container already detached or removed');
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, [mapInstanceKey]);

  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      const container = map.getContainer();
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        mapRef.current = map;
        
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.invalidateSize(true);
              setIsMapReady(true);
            } catch (err) {
              console.warn('Error invalidating map size:', err);
            }
          }
        }, 300);
        
        if (selectedLocation) {
          console.log('Flying to initial location');
          setTimeout(() => {
            if (mapRef.current) {
              try {
                const container = mapRef.current.getContainer();
                if (container && document.body.contains(container)) {
                  mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
                    animate: true,
                    duration: 1.5
                  });
                }
              } catch (err) {
                console.warn('Error flying to initial location:', err);
              }
            }
          }, 500);
        }
      } else {
        console.warn('Map container not verified, skipping reference assignment');
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };

  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    handleSetMapRef,
  };
}
