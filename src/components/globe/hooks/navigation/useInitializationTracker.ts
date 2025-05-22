
import { useRef, useEffect, useCallback } from 'react';
import { Location } from '@/utils/geo-utils';

/**
 * Custom hook to track globe initialization and handle retry logic
 */
export function useInitializationTracker(
  selectedLocation: Location | undefined,
  globeAPI: any,
  isFlying: boolean,
  flyToLocation: (location: Location, api: any) => boolean
) {
  const initializationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if the API is ready and attempt navigation if needed
  const checkApiAndNavigate = useCallback(() => {
    if (!globeAPI || !selectedLocation) return;
    
    console.log("ThreeGlobe: Initialization check - attempting navigation if needed");
    
    // Force attempt navigation after delay if globe is available but not marked as initialized
    const locationId = selectedLocation.id;
    if (globeAPI.flyToLocation) {
      console.log(`ThreeGlobe: Forced navigation attempt to ${selectedLocation.label}`);
      flyToLocation(selectedLocation, globeAPI);
    }
  }, [selectedLocation, globeAPI, flyToLocation]);

  // Set up an initialization timer to retry initialization if needed
  useEffect(() => {
    console.log("ThreeGlobe: Setting up initialization check timer");
    
    initializationTimerRef.current = setTimeout(() => {
      if (globeAPI && !isFlying && selectedLocation) {
        checkApiAndNavigate();
      }
    }, 2000); // Wait 2 seconds before trying forced navigation
    
    return () => {
      if (initializationTimerRef.current !== null) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, [selectedLocation, globeAPI, isFlying, checkApiAndNavigate]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (initializationTimerRef.current !== null) {
      clearTimeout(initializationTimerRef.current);
    }
  }, []);

  return {
    cleanup
  };
}
