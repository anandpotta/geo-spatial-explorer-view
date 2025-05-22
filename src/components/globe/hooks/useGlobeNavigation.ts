
import { useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';
import { useFlyHandler } from './navigation/useFlyHandler';
import { useInitializationTracker } from './navigation/useInitializationTracker';
import { useLocationValidator } from './navigation/useLocationValidator';

export function useGlobeNavigation(
  selectedLocation?: Location,
  isInitialized: boolean = false,
  onFlyComplete?: () => void
) {
  // Create a dummy ref for useThreeGlobe since we're just accessing the global API
  const dummyContainerRef = useRef<HTMLDivElement>(null);

  // Get the globe API - pass dummyContainerRef to satisfy the function signature
  const globeAPI = useThreeGlobe(dummyContainerRef);

  // Use the smaller hooks
  const { 
    isFlying, 
    selectedLocationLabel, 
    flyToLocation, 
    lastFlyLocationRef,
    isUnmountedRef,
    cleanup: cleanupFlyHandler 
  } = useFlyHandler(onFlyComplete);

  const { validateLocation } = useLocationValidator();
  
  const { cleanup: cleanupInitTracker } = useInitializationTracker(
    selectedLocation, 
    globeAPI, 
    isFlying, 
    flyToLocation
  );

  // Handle location changes
  useEffect(() => {
    if (!selectedLocation) {
      console.log("Globe navigation: No location selected");
      return;
    }
    
    if (!globeAPI) {
      console.log("Globe navigation: Globe API not available yet");
      return;
    }
    
    // If we're already flying to this location, don't start another flight
    const locationId = selectedLocation.id;
    if (locationId === lastFlyLocationRef.current && isFlying) {
      console.log(`ThreeGlobe: Already flying to ${selectedLocation.label}, skipping duplicate navigation`);
      return;
    }
    
    console.log(`ThreeGlobe: Received navigation request to ${selectedLocation.label}`, {
      globeAPIAvailable: !!globeAPI,
      isInitialized,
      globalInitialized: globeAPI?.isInitialized,
      hasFlightMethod: !!globeAPI?.flyToLocation
    });
    
    // Validate the location
    if (!validateLocation(selectedLocation)) {
      return;
    }
    
    // Try to navigate - if the API looks ready
    if (isInitialized && globeAPI.flyToLocation) {
      console.log(`ThreeGlobe: Attempting to fly to ${selectedLocation.label}`);
      flyToLocation(selectedLocation, globeAPI);
    } else {
      console.log("Globe API not fully ready or not initialized yet");
      
      // Set a retry timer for this specific location
      setTimeout(() => {
        if (isUnmountedRef.current) return;
        
        // Only retry if we haven't navigated to this location yet
        if (lastFlyLocationRef.current !== locationId && globeAPI && globeAPI.flyToLocation) {
          console.log(`ThreeGlobe: Retry navigation to ${selectedLocation.label}`);
          flyToLocation(selectedLocation, globeAPI);
        }
      }, 1000);
    }
  }, [selectedLocation, globeAPI, isFlying, isInitialized, flyToLocation, lastFlyLocationRef, isUnmountedRef, validateLocation]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupFlyHandler();
      cleanupInitTracker();
      
      // Ensure any ongoing flights are canceled
      if (globeAPI && globeAPI.cancelFlight) {
        globeAPI.cancelFlight();
      }
    };
  }, [globeAPI, cleanupFlyHandler, cleanupInitTracker]);

  return {
    isFlying,
    selectedLocationLabel
  };
}
