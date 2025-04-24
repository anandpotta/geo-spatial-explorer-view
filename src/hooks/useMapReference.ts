
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export const useMapReference = (
  mapRef: React.MutableRefObject<L.Map | null>, // Changed from RefObject to MutableRefObject
  selectedLocation: Location | undefined,
  onMapReady?: (map: L.Map) => void
) => {
  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      // Verify map is properly initialized
      if (map && map.getContainer()) {
        console.log('Map container verified, storing reference');
        mapRef.current = map;
        
        // Force invalidate size to ensure proper rendering
        map.invalidateSize(true);
        
        // Only fly to location if we have one and the map is ready
        if (selectedLocation) {
          console.log('Flying to initial location');
          setTimeout(() => {
            // Check map exists and has a container before flying
            if (map && map.getContainer && typeof map.getContainer === 'function') {
              try {
                map.flyTo([selectedLocation.y, selectedLocation.x], 18, {
                  animate: true,
                  duration: 1.5
                });
              } catch (err) {
                console.error('Error during initial flyTo:', err);
              }
            }
          }, 200);
        }
        
        if (onMapReady) {
          onMapReady(map);
        }
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };

  return handleSetMapRef;
};
