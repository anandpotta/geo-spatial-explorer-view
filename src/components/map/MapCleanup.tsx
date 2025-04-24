
import { useEffect } from 'react';
import { setupLeafletIcons } from './LeafletMapIcons';
import L from 'leaflet';

interface MapCleanupProps {
  mapInstanceKey: number;
  mapRef: React.MutableRefObject<L.Map | null>;
  cleanupInProgress: React.MutableRefObject<boolean>;
  mapContainerId: React.MutableRefObject<string>;
}

const MapCleanup = ({ mapInstanceKey, mapRef, cleanupInProgress, mapContainerId }: MapCleanupProps) => {
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
      cleanupInProgress.current = true;
      
      if (mapRef.current) {
        try {
          console.log('Cleaning up Leaflet map instance');
          
          mapRef.current.off();
          
          mapRef.current.eachLayer(layer => {
            try {
              mapRef.current?.removeLayer(layer);
            } catch (e) {
              console.warn('Error removing layer:', e);
            }
          });
          
          try {
            if (mapRef.current.getContainer() && document.contains(mapRef.current.getContainer())) {
              mapRef.current.remove();
            }
          } catch (e) {
            console.warn('Error removing map:', e);
          }
          
          mapRef.current = null;
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
      
      const oldContainer = document.getElementById(mapContainerId.current);
      if (oldContainer) {
        const parent = oldContainer.parentElement;
        if (parent) {
          try {
            parent.removeChild(oldContainer);
            
            const newContainer = document.createElement('div');
            newContainer.id = `map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            newContainer.style.width = '100%';
            newContainer.style.height = '100%';
            parent.appendChild(newContainer);
          } catch (e) {
            console.warn('Error replacing container:', e);
          }
        }
      }
      
      cleanupInProgress.current = false;
    };
  }, [mapInstanceKey, mapRef, cleanupInProgress, mapContainerId]);

  return null;
};

export default MapCleanup;
