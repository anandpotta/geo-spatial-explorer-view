
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { createMarkerPosition } from '@/utils/globe-utils';

/**
 * Hook to handle globe flight controls and location transitions
 */
export function useGlobeFlightControl(
  selectedLocation: Location | undefined,
  globeAPI: any,
  isFlying: boolean,
  setIsFlying: (value: boolean) => void,
  lastFlyLocationRef: React.MutableRefObject<string | null>,
  flyCompletedCallbackRef: React.MutableRefObject<(() => void) | null>,
  mountedRef: React.MutableRefObject<boolean>,
  onFlyComplete?: () => void
) {
  // Handle fly completion with debouncing
  const handleFlyComplete = () => {
    if (!mountedRef.current) return;
    setIsFlying(false);
    
    // Execute the stored callback if exists
    if (flyCompletedCallbackRef.current && mountedRef.current) {
      const callback = flyCompletedCallbackRef.current;
      flyCompletedCallbackRef.current = null;
      
      // Small delay for smoother transition experience
      setTimeout(() => {
        if (mountedRef.current) {
          callback();
        }
      }, 100);
    }
  };
  
  // Handle location changes with better flight state management
  useEffect(() => {
    if (!globeAPI.isInitialized || !selectedLocation || !mountedRef.current) return;
    
    // Prevent duplicate fly operations for the same location
    const locationId = selectedLocation.id;
    if (isFlying) {
      console.log("ThreeGlobe: Already flying, queueing new flight request");
      
      // Store the callback to execute when current flight completes
      flyCompletedCallbackRef.current = () => {
        if (onFlyComplete && mountedRef.current) {
          console.log("ThreeGlobe: Executing queued fly complete callback");
          onFlyComplete();
        }
      };
      
      return;
    }
    
    if (locationId === lastFlyLocationRef.current) {
      console.log("ThreeGlobe: Skipping duplicate location selection:", locationId);
      return;
    }
    
    console.log("ThreeGlobe: Flying to location:", selectedLocation.label);
    setIsFlying(true);
    lastFlyLocationRef.current = locationId;
    
    // Calculate marker position
    const markerPosition = createMarkerPosition(selectedLocation, 1.01); // Slightly above globe surface
    
    // Fly to the location - ensure coordinates are valid numbers
    if (typeof selectedLocation.x === 'number' && typeof selectedLocation.y === 'number') {
      try {
        globeAPI.flyToLocation(selectedLocation.y, selectedLocation.x, () => {
          if (mountedRef.current) {
            handleFlyComplete();
            if (onFlyComplete && mountedRef.current) {
              console.log("ThreeGlobe: Fly complete");
              onFlyComplete();
            }
          }
        });
        
        // Add marker at the location with null check
        if (globeAPI.addMarker && mountedRef.current) {
          globeAPI.addMarker(selectedLocation.id, markerPosition, selectedLocation.label);
        }
      } catch (error) {
        console.error("Error during fly operation:", error);
        // Handle error gracefully
        setIsFlying(false);
        if (onFlyComplete && mountedRef.current) onFlyComplete();
      }
    } else {
      console.error("Invalid coordinates:", selectedLocation);
      setIsFlying(false);
      if (onFlyComplete && mountedRef.current) onFlyComplete();
    }
  }, [selectedLocation, globeAPI, onFlyComplete, isFlying, globeAPI.isInitialized, setIsFlying, lastFlyLocationRef, flyCompletedCallbackRef, mountedRef]);
}
