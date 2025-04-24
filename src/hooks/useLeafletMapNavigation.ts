
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
    // Early return if basic conditions aren't met
    if (!map || !isMapInitialized || cleanupInProgress) {
      console.log('Map not initialized for flyTo');
      return false;
    }
    
    try {
      // Ensure map container exists and is in DOM
      if (!map.getContainer() || !document.body.contains(map.getContainer())) {
        console.warn('Map container not available for flyTo');
        return false;
      }
      
      // Make sure essential map elements are available
      const mapPane = map.getContainer().querySelector('.leaflet-map-pane');
      if (!mapPane) {
        console.warn('Map pane not found, map may not be ready for flyTo');
        return false;
      }
      
      // Update map size first to ensure proper rendering
      map.invalidateSize(true);
      
      // Set view immediately (more reliable than flyTo)
      map.setView([lat, lng], zoom, { animate: false });
      
      // Add a slight delay before attempting the animated flyTo
      setTimeout(() => {
        try {
          // Double check map is still available before animating
          if (!map || cleanupInProgress) return;
          
          if (map.getContainer() && document.body.contains(map.getContainer())) {
            // Now attempt the smooth animation
            map.flyTo([lat, lng], zoom, {
              animate: true,
              duration: 1.5
            });
          }
        } catch (flyErr) {
          console.warn('Error during flyTo, but position should be set:', flyErr);
        }
      }, 800); // Increased timeout for better reliability
      
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
