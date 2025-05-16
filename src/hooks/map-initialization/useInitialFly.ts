
import { useRef } from 'react';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { Location } from '@/utils/geo-utils';

/**
 * Hook to handle initial flying to a location
 */
export function useInitialFly() {
  const initialFlyComplete = useRef(false);
  const initialFlyAttempted = useRef(false);
  const flyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset fly state
  const resetFlyState = () => {
    initialFlyComplete.current = false;
    initialFlyAttempted.current = false;
  };
  
  // Clean up fly timeout
  const cleanupFly = () => {
    if (flyTimeoutRef.current) {
      clearTimeout(flyTimeoutRef.current);
      flyTimeoutRef.current = null;
    }
  };
  
  // Handle initial fly to location
  const handleInitialFly = (
    mapRef: React.MutableRefObject<L.Map | null>,
    selectedLocation: Location | undefined,
    recoveryAttemptRef: React.MutableRefObject<number>
  ) => {
    // Only attempt flying once
    if (initialFlyAttempted.current || initialFlyComplete.current || !selectedLocation || !mapRef.current) {
      return;
    }
    
    initialFlyAttempted.current = true;
    
    try {
      // First check if map is valid
      if (!isMapValid(mapRef.current)) {
        console.warn("Map not valid for initial fly");
        return;
      }
      
      // Explicitly check map panes
      const mapPanes = mapRef.current.getPanes();
      if (!mapPanes || !mapPanes.mapPane) {
        console.warn("Map panes not ready for initial fly");
        return;
      }
      
      console.log('Flying to initial location after ensuring map stability');
      mapRef.current.setView(
        [selectedLocation.y, selectedLocation.x], 
        16, 
        { animate: false }
      );
      
      initialFlyComplete.current = true;
    } catch (flyErr) {
      console.error('Error in initial fly operation:', flyErr);
      
      // Try again once more after a delay
      if (recoveryAttemptRef.current < 2) {
        recoveryAttemptRef.current++;
        flyTimeoutRef.current = setTimeout(() => {
          if (mapRef.current && isMapValid(mapRef.current) && !initialFlyComplete.current) {
            try {
              console.log('Retry initial fly with setView');
              mapRef.current.setView(
                [selectedLocation.y, selectedLocation.x], 
                16, 
                { animate: false }
              );
              initialFlyComplete.current = true;
            } catch (retryErr) {
              console.error('Error in retry fly operation:', retryErr);
            }
          }
        }, 1500);
      }
    }
  };

  return {
    initialFlyComplete,
    initialFlyAttempted,
    flyTimeoutRef,
    resetFlyState,
    cleanupFly,
    handleInitialFly
  };
}
