import L from 'leaflet';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet';

/**
 * Sets up validation checking for a Leaflet map instance
 */
export function setupMapValidityChecks(
  mapRef: React.MutableRefObject<L.Map | null>,
  isMapReady: boolean, 
  setIsMapReady: (ready: boolean) => void,
  mapAttachedRef: React.MutableRefObject<boolean>,
  validityChecksRef: React.MutableRefObject<number>,
  recoveryAttemptRef: React.MutableRefObject<number>,
) {
  // Skip if map is already ready
  if (isMapReady) return null;
  
  const checkMapValidity = () => {
    if (!mapRef.current) return;
    
    try {
      // Use utility function for map validation
      const isValid = isMapValid(mapRef.current);
      
      // Only increment when checking
      validityChecksRef.current += 1;
      
      // If map is valid but not marked as ready
      if (isValid && !isMapReady && mapAttachedRef.current) {
        console.log('Map is now valid, marking as ready');
        setIsMapReady(true);
        return true; // Validity check passed
      }
      // If map becomes invalid after being ready
      else if (!isValid && isMapReady) {
        console.warn('Map is no longer valid, attempting recovery');
        
        // Try recovery but limit attempts
        if (recoveryAttemptRef.current < 2) {
          recoveryAttemptRef.current += 1;
          
          setTimeout(() => {
            if (mapRef.current) {
              try {
                mapRef.current.invalidateSize(true);
              } catch (err) {
                console.error("Map recovery failed:", err);
              }
            }
          }, 1000);
        }
      }
    } catch (err) {
      // Only log errors, don't change state unnecessarily
      console.warn("Map validation error:", err.message);
    }
    
    return false; // Validity check not conclusive
  };
  
  return checkMapValidity;
}

/**
 * Handle initial location navigation after map is stable
 */
export function handleInitialLocationNavigation(
  map: L.Map, 
  selectedLocation?: { x: number, y: number },
  initialFlyCompleteRef?: React.MutableRefObject<boolean>
) {
  if (!selectedLocation) return;
  
  if (initialFlyCompleteRef && !initialFlyCompleteRef.current) {
    initialFlyCompleteRef.current = true;
    try {
      console.log('Flying to initial location after ensuring map stability');
      map.flyTo(
        [selectedLocation.y, selectedLocation.x], 
        18, 
        { animate: true, duration: 1.5 }
      );
    } catch (flyErr) {
      console.error('Error in initial fly operation:', flyErr);
    }
  }
}
