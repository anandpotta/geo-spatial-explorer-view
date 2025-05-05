
import { useCallback } from 'react';
import L from 'leaflet';
import { handleInitialLocationNavigation } from '@/utils/map-validation-utils';

/**
 * Hook to handle setting the map reference and initialization
 */
export function useMapReferenceHandler(
  mapRef: React.MutableRefObject<L.Map | null>,
  mapAttachedRef: React.MutableRefObject<boolean>,
  validityChecksRef: React.MutableRefObject<number>,
  recoveryAttemptRef: React.MutableRefObject<number>,
  initialFlyCompleteRef: React.MutableRefObject<boolean>,
  setIsMapReady: (ready: boolean) => void,
  selectedLocation?: { x: number, y: number }
) {
  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      const container = map.getContainer();
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        mapRef.current = map;
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
              handleInitialLocationNavigation(
                mapRef.current,
                selectedLocation,
                initialFlyCompleteRef
              );
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
  }, [
    mapRef, 
    mapAttachedRef, 
    validityChecksRef, 
    recoveryAttemptRef, 
    initialFlyCompleteRef, 
    setIsMapReady, 
    selectedLocation
  ]);

  return handleSetMapRef;
}
