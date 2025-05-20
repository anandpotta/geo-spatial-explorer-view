
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
        
        // Single invalidation to ensure the map is properly sized
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.invalidateSize(true);
              console.log('Initial map invalidation completed');
              setIsMapReady(true);
              
              // Handle initial location navigation once the map is ready
              if (selectedLocation && !initialFlyComplete.current) {
                initialFlyComplete.current = true;
                try {
                  console.log('Flying to initial location after ensuring map stability');
                  mapRef.current.flyTo(
                    [selectedLocation.y, selectedLocation.x], 
                    18, 
                    { animate: true, duration: 1.5 }
                  );
                } catch (flyErr) {
                  console.error('Error in initial fly operation:', flyErr);
                }
              }
            } catch (err) {
              console.warn(`Error during invalidation:`, err);
            }
          }
        }, 500);
      } else {
        console.warn('Map container not verified, skipping reference assignment');
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };
  
  return { handleSetMapRef };
}
