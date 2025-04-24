
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export const useMapReference = (
  mapRef: React.MutableRefObject<L.Map | null>,
  selectedLocation: Location | undefined,
  onMapReady?: (map: L.Map) => void
) => {
  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (!map || !map.getContainer) {
      console.error('Invalid map reference provided');
      return;
    }
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      // Verify map is properly initialized before proceeding
      if (map._leaflet_id && map.getContainer()) {
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
          }, 300); // Increased timeout for better initialization
        }
        
        if (onMapReady) {
          onMapReady(map);
        }
      } else {
        console.warn('Map not fully initialized, delaying reference assignment');
        setTimeout(() => {
          if (map && map._leaflet_id) {
            mapRef.current = map;
            map.invalidateSize(true);
            
            if (onMapReady) {
              onMapReady(map);
            }
          }
        }, 300);
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };

  return handleSetMapRef;
};
