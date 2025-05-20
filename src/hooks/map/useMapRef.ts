
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
      
      // Check for valid container and map panes
      if (container && document.body.contains(container) && 
          (map as any)._panes && (map as any)._panes.mapPane) {
        console.log('Map container verified, storing reference');
        
        // Use Object.assign instead of direct assignment to avoid TypeScript errors with readonly property
        Object.assign(mapRef, { current: map });
        
        mapAttachedRef.current = true;
        
        // Reset counters when we get a valid map
        validityChecksRef.current = 0;
        recoveryAttemptRef.current = 0;
        
        // Wait for the map to be properly attached before attempting to fly to location
        const initializeMapView = () => {
          if (mapRef.current) {
            try {
              // Do an initial size invalidation with safety checks
              if ((mapRef.current as any)._loaded && 
                  (mapRef.current as any)._panes && 
                  (mapRef.current as any)._panes.mapPane && 
                  (mapRef.current as any)._panes.mapPane._leaflet_pos) {
                mapRef.current.invalidateSize(false);
                console.log('Initial map invalidation completed');
              } else {
                console.log('Map not ready for invalidation, skipping');
              }
              
              // Handle initial location navigation with delay for proper map readiness
              if (selectedLocation && !initialFlyComplete.current) {
                // Delay the initial fly a bit more to ensure the map is fully initialized
                setTimeout(() => {
                  if (mapRef.current && 
                      document.body.contains(mapRef.current.getContainer()) &&
                      (mapRef.current as any)._loaded) {
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
              console.warn(`Error during map view initialization:`, err);
            }
          }
        };
        
        // Use a more reliable approach with multiple attempts
        setTimeout(initializeMapView, 250);
        setTimeout(initializeMapView, 500);
        setTimeout(initializeMapView, 1000);
      } else {
        console.warn('Map container not verified, skipping reference assignment');
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };
  
  return { handleSetMapRef };
}
