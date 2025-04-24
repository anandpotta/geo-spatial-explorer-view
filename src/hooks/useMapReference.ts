
import { useCallback, useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export const useMapReference = (
  mapRef: React.MutableRefObject<L.Map | null>,
  selectedLocation: Location | undefined,
  onMapReady?: (map: L.Map) => void
) => {
  const hasSetRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Move all the logic to useEffect to avoid conditional hook calls
  useEffect(() => {
    // This function will be defined inside useEffect, not with useCallback
    const setMapRef = (map: L.Map) => {
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
        if (map && typeof map.getContainer === 'function') {
          const container = map.getContainer();
          
          if (container) {
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
                if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
                  try {
                    mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
                      animate: true,
                      duration: 1.5
                    });
                  } catch (err) {
                    console.error('Error during initial flyTo:', err);
                  }
                }
              }, 300);
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
              if (!hasSetRef.current && map && typeof map.getContainer === 'function' && map.getContainer()) {
                mapRef.current = map;
                hasSetRef.current = true;
                map.invalidateSize(true);
                
                if (onMapReady) {
                  onMapReady(map);
                }
              }
            }, 300);
          }
        }
      } catch (err) {
        console.error('Error setting map reference:', err);
      }
    };

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mapRef, selectedLocation, onMapReady]);

  // This is now a stable reference that won't change between renders
  return useCallback((map: L.Map) => {
    console.log('Map reference callback triggered');
    
    if (!map || !map.getContainer) {
      console.error('Invalid map reference in callback');
      return;
    }
    
    try {
      // Verify map is properly initialized before proceeding
      if (map && typeof map.getContainer === 'function') {
        const container = map.getContainer();
        
        if (container && !hasSetRef.current && !mapRef.current) {
          console.log('Container verified, proceeding with map setup');
          
          // Force invalidate size to ensure proper rendering
          map.invalidateSize(true);
          
          // Set the map reference
          mapRef.current = map;
          hasSetRef.current = true;
          
          // Call onMapReady if provided
          if (onMapReady) onMapReady(map);
          
          // Handle flying to initial location if available
          if (selectedLocation) {
            console.log('Flying to location from callback');
            setTimeout(() => {
              if (mapRef.current) {
                try {
                  mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
                    animate: true,
                    duration: 1.5
                  });
                } catch (err) {
                  console.error('Error flying to location:', err);
                }
              }
            }, 300);
          }
        }
      }
    } catch (err) {
      console.error('Error in map reference callback:', err);
    }
  }, [mapRef, selectedLocation, onMapReady]);
};
