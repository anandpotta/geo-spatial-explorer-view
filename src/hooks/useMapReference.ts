
import { useCallback, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export const useMapReference = (
  mapRef: React.MutableRefObject<L.Map | null>,
  selectedLocation: Location | undefined,
  onMapReady?: (map: L.Map) => void
) => {
  const hasSetRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    if (!map || !map.getContainer) {
      console.error('Invalid map reference provided');
      return;
    }
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    if (hasSetRef.current) {
      return; // Prevent multiple assignments
    }
    
    try {
      // Verify map is properly initialized before proceeding
      // Use proper methods to check map initialization rather than internal properties
      if (map && map.getContainer()) {
        console.log('Map container verified, storing reference');
        mapRef.current = map;
        hasSetRef.current = true;
        
        // Force invalidate size to ensure proper rendering
        map.invalidateSize(true);
        
        // Only fly to location if we have one and the map is ready
        if (selectedLocation) {
          console.log('Flying to initial location');
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
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
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          if (map && map.getContainer()) {
            mapRef.current = map;
            hasSetRef.current = true;
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
  }, [mapRef, selectedLocation, onMapReady]);

  return handleSetMapRef;
};
