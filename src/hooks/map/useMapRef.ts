
import { useState } from 'react';
import L from 'leaflet';

export function useMapRef(
  mapRef: React.RefObject<L.Map | null>,
  mapAttachedRef: React.MutableRefObject<boolean>,
  validityChecksRef: React.MutableRefObject<number>,
  recoveryAttemptRef: React.MutableRefObject<number>,
  initialFlyComplete: React.MutableRefObject<boolean>,
  setIsMapReady: (ready: boolean) => void,
  mapInstanceKey: number,
  selectedLocation?: { x: number, y: number }
) {
  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      const container = map.getContainer();
      
      // Store a unique instance ID on the container
      container.dataset.mapInstanceId = `map-instance-${mapInstanceKey}`;
      
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        
        // Use Object.assign instead of direct assignment to avoid TypeScript errors with readonly property
        Object.assign(mapRef, { current: map });
        
        mapAttachedRef.current = true;
        
        // Reset counters when we get a valid map
        validityChecksRef.current = 0;
        recoveryAttemptRef.current = 0;
        
        // Wait for the map to be properly attached before attempting to fly to location
        setTimeout(() => {
          if (mapRef.current) {
            try {
              // Do an initial size invalidation to ensure proper rendering
              mapRef.current.invalidateSize(false);
              console.log('Initial map invalidation completed');
              
              // Handle initial location navigation with delay for proper map readiness
              if (selectedLocation && !initialFlyComplete.current) {
                // Delay the initial fly a bit more to ensure the map is fully initialized
                setTimeout(() => {
                  if (mapRef.current && document.body.contains(mapRef.current.getContainer())) {
                    try {
                      console.log(`Flying to initial location: ${selectedLocation.y}, ${selectedLocation.x}`);
                      mapRef.current.flyTo(
                        [selectedLocation.y, selectedLocation.x], 
                        18, 
                        { animate: true, duration: 1.5 }
                      );
                      initialFlyComplete.current = true;
                    } catch (flyErr) {
                      console.error('Error in initial fly operation:', flyErr);
                    }
                  }
                }, 500); // Additional delay for map stability
              }
              
              // Mark map as ready after we've set up the initial location
              setIsMapReady(true);
            } catch (err) {
              console.warn(`Error during invalidation:`, err);
            }
          }
        }, 250);
      } else {
        console.warn('Map container not verified, skipping reference assignment');
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };
  
  return { handleSetMapRef };
}
