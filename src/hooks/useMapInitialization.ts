
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import { getSavedMarkers } from '@/utils/marker-utils';

export const useMapInitialization = (
  mapInstanceKey: number,
  mapState: any,
  onCleanup?: () => void
) => {
  const mapRef = useRef<L.Map | null>(null);

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
    
    // Load saved markers from storage
    const savedMarkers = getSavedMarkers();
    mapState.setMarkers(savedMarkers);
    
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          // Important: Remove all layers first before removing the map
          mapRef.current.eachLayer((layer) => {
            mapRef.current?.removeLayer(layer);
          });
          
          // Then properly remove the map
          mapRef.current.remove();
          mapRef.current = null;
          
          if (onCleanup) {
            onCleanup();
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
    };
  }, [mapInstanceKey, mapState, onCleanup]);

  return mapRef;
};
