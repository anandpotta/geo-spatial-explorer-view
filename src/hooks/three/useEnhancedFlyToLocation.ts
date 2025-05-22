
import { useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useFlyToLocation } from './useFlyToLocation';
import { useAutoRotation } from './useAutoRotation';
import { useFlightRetry } from './flight/useFlightRetry';
import { useFlightTimeouts } from './flight/useFlightTimeouts';
import { useFlightState } from './flight/useFlightState';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook providing enhanced flying to location with auto rotation management
 */
export function useEnhancedFlyToLocation(
  camera: THREE.PerspectiveCamera | null,
  controlsRef: React.MutableRefObject<OrbitControls | null>,
  globeRadius: number,
  externalFlyingRef?: React.MutableRefObject<boolean>
) {
  // Use the extracted hooks
  const { retryTimeoutRef, resetRetryCount, clearRetryTimeout, handleRetry } = useFlightRetry();
  const { clearAllTimeouts, setCallbackTimeout, setStabilizationTimeout } = useFlightTimeouts();
  const { isFlyingRef, completedCallbackRef, startFlying, stopFlying } = useFlightState(externalFlyingRef);
  
  // Get auto-rotation controls
  const { setAutoRotation } = useAutoRotation(controlsRef);
  
  // Get basic flyToLocation from useFlyToLocation
  const { flyToLocation, cancelFlight, animationInProgressRef } = useFlyToLocation(
    { current: camera }, // Wrap camera in an object with current property to match MutableRefObject type
    controlsRef,
    globeRadius
  );
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cancel any ongoing flights when component unmounts
      cancelFlight();
      stopFlying();
      clearAllTimeouts();
      clearRetryTimeout();
      resetRetryCount();
    };
  }, [cancelFlight, clearAllTimeouts, clearRetryTimeout, resetRetryCount, stopFlying]);
  
  // Watch animation state and trigger callback when animation finishes
  useEffect(() => {
    if (!animationInProgressRef.current && isFlyingRef.current && completedCallbackRef.current) {
      const callback = completedCallbackRef.current;
      
      // Reset state before calling callback to prevent infinite loops
      stopFlying();
      
      // Call the callback after a small delay to ensure everything is settled
      setCallbackTimeout(() => {
        if (callback) {
          console.log("Fly animation complete, calling completion callback from effect");
          callback();
        }
      });
    }
  }, [animationInProgressRef.current, isFlyingRef, setCallbackTimeout, stopFlying]);
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Reset retry counter
    resetRetryCount();
    
    const attemptFlight = () => {
      // Cancel any ongoing flight first
      cancelFlight();
      
      // Clear any existing timeouts
      clearAllTimeouts();
      clearRetryTimeout();
      
      // Set flying state to true to prevent animation conflicts
      startFlying(onComplete);
      
      // Log the navigation attempt
      console.log(`EnhancedFlyToLocation: Flying to ${latitude}, ${longitude}`);
      
      // Show toast for navigation
      toast({
        title: "Traveling to location",
        description: "Flying across the globe...",
        duration: 2500
      });
      
      // Temporarily disable auto-rotation for smoother flight
      setAutoRotation(false);
      
      // Check if camera and controls are ready
      if (!camera || !controlsRef.current) {
        console.warn("Camera or controls not ready yet, will retry in a moment");
        
        // Handle retry with progressive backoff
        const success = handleRetry(attemptFlight, "Couldn't initialize camera for navigation");
        
        // If retry handling failed and exceeded max attempts
        if (!success && onComplete) {
          onComplete();
        }
        return;
      }
      
      // Call the original flyToLocation with an internal callback
      flyToLocation(longitude, latitude, () => {
        // This will be called when the flight animation completes
        console.log(`EnhancedFlyToLocation: Flight completed to ${latitude}, ${longitude}`);
        
        // Add a stabilization period after flight completes before callback
        setStabilizationTimeout(() => {
          // Re-enable auto-rotation with a smooth start
          setAutoRotation(true);
          
          // Call onComplete directly here as well as relying on the effect
          if (onComplete && isFlyingRef.current) {
            console.log("Calling onComplete callback from direct callback");
            
            // Add a small delay to ensure processing is complete
            setCallbackTimeout(() => {
              stopFlying();
              onComplete();
            }, 150);
          }
        });
      });
    };
    
    // Start the flight attempt
    attemptFlight();
  }, [
    flyToLocation, 
    setAutoRotation, 
    cancelFlight, 
    camera, 
    controlsRef, 
    clearAllTimeouts, 
    clearRetryTimeout,
    resetRetryCount, 
    handleRetry, 
    startFlying, 
    stopFlying, 
    setCallbackTimeout, 
    setStabilizationTimeout,
    isFlyingRef
  ]);
  
  return {
    enhancedFlyToLocation,
    isFlyingRef,
    cancelFlight
  };
}
