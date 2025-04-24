
import { useCallback } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { toast } from 'sonner';

export const useLeafletMapNavigation = () => {
  const safeMapFlyTo = useCallback((
    map: L.Map | null,
    isMapInitialized: boolean,
    cleanupInProgress: boolean,
    lat: number,
    lng: number,
    zoom: number = 18
  ): boolean => {
    if (!map || !isMapInitialized || cleanupInProgress) {
      console.error('Map not initialized for flyTo');
      return false;
    }
    
    try {
      if (!map.getContainer() || !document.contains(map.getContainer())) {
        console.warn('Map container not available for flyTo');
        return false;
      }
      
      const mapPane = map.getContainer().querySelector('.leaflet-map-pane');
      if (!mapPane) {
        console.warn('Map pane not found, map may not be ready for flyTo');
        return false;
      }
      
      map.invalidateSize(true);
      
      setTimeout(() => {
        try {
          map.setView([lat, lng], zoom);
          
          setTimeout(() => {
            if (!map || cleanupInProgress) return;
            
            try {
              if (map.getContainer() && document.contains(map.getContainer())) {
                map.flyTo([lat, lng], zoom, {
                  animate: true,
                  duration: 1.5
                });
              }
            } catch (flyErr) {
              console.warn('Error during flyTo, but position should be set:', flyErr);
            }
          }, 500);
        } catch (err) {
          console.error('Error in safeMapFlyTo:', err);
          return false;
        }
      }, 300);
      
      return true;
    } catch (err) {
      console.error('Error in safeMapFlyTo outer block:', err);
      return false;
    }
  }, []);

  const handleLocationSelect = useCallback((
    position: [number, number],
    onLocationSelect?: (location: Location) => void
  ) => {
    const [lat, lng] = position;
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates:', { lat, lng });
      toast.error('Invalid location coordinates');
      return;
    }

    if (onLocationSelect) {
      const location: Location = {
        id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        label: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        y: lat,
        x: lng
      };
      onLocationSelect(location);
    }
  }, []);

  return {
    safeMapFlyTo,
    handleLocationSelect
  };
};
