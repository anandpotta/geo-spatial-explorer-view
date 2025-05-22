
import { useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFlyToLocation } from './useFlyToLocation';
import { useAutoRotation } from './useAutoRotation';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
  // Refs
  const internalFlyingRef = useRef<boolean>(false);
  const completedCallbackRef = useRef<(() => void) | undefined>(undefined);
  const callbackTimeoutRef = useRef<number | null>(null);
  const stabilizationTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  
  // Determine which ref to use for tracking flying state
  const isFlyingRef = externalFlyingRef || internalFlyingRef;
  
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
      isFlyingRef.current = false;
      completedCallbackRef.current = undefined;
      
      if (callbackTimeoutRef.current !== null) {
        window.clearTimeout(callbackTimeoutRef.current);
        callbackTimeoutRef.current = null;
      }
      
      if (stabilizationTimeoutRef.current !== null) {
        window.clearTimeout(stabilizationTimeoutRef.current);
        stabilizationTimeoutRef.current = null;
      }
      
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [cancelFlight]);
  
  // Watch animation state and trigger callback when animation finishes
  useEffect(() => {
    if (!animationInProgressRef.current && isFlyingRef.current && completedCallbackRef.current) {
      const callback = completedCallbackRef.current;
      
      // Reset state before calling callback to prevent infinite loops
      isFlyingRef.current = false;
      completedCallbackRef.current = undefined;
      
      // Clear any existing timeout
      if (callbackTimeoutRef.current !== null) {
        window.clearTimeout(callbackTimeoutRef.current);
      }
      
      // Call the callback after a small delay to ensure everything is settled
      callbackTimeoutRef.current = window.setTimeout(() => {
        callbackTimeoutRef.current = null;
        if (callback) {
          console.log("Fly animation complete, calling completion callback from effect");
          callback();
        }
      }, 250); // Slightly longer delay for better stability
    }
  }, [animationInProgressRef.current, isFlyingRef]);
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Cancel any ongoing flight first
    cancelFlight();
    
    // Clear any existing timeouts
    if (callbackTimeoutRef.current !== null) {
      window.clearTimeout(callbackTimeoutRef.current);
      callbackTimeoutRef.current = null;
    }
    
    if (stabilizationTimeoutRef.current !== null) {
      window.clearTimeout(stabilizationTimeoutRef.current);
      stabilizationTimeoutRef.current = null;
    }
    
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Set flying state to true to prevent animation conflicts
    isFlyingRef.current = true;
    
    // Store the callback for later
    completedCallbackRef.current = onComplete;
    
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
      
      // Set a retry timer
      retryTimeoutRef.current = window.setTimeout(() => {
        retryTimeoutRef.current = null;
        
        if (camera && controlsRef.current) {
          console.log("Retrying flight after camera initialized");
          enhancedFlyToLocation(longitude, latitude, onComplete);
        } else {
          console.error("Camera still not initialized after delay, cannot navigate");
          // Still call completion callback so the app can proceed
          if (onComplete) {
            onComplete();
          }
        }
      }, 1000);
      
      return;
    }
    
    // Call the original flyToLocation with an internal callback
    flyToLocation(longitude, latitude, () => {
      // This will be called when the flight animation completes
      console.log(`EnhancedFlyToLocation: Flight completed to ${latitude}, ${longitude}`);
      
      // Add a stabilization period after flight completes before callback
      stabilizationTimeoutRef.current = window.setTimeout(() => {
        stabilizationTimeoutRef.current = null;
        
        // Re-enable auto-rotation with a smooth start
        setAutoRotation(true);
        
        // Call onComplete directly here as well as relying on the effect
        if (onComplete && isFlyingRef.current) {
          console.log("Calling onComplete callback from direct callback");
          
          // Add a small delay to ensure processing is complete
          callbackTimeoutRef.current = window.setTimeout(() => {
            callbackTimeoutRef.current = null;
            isFlyingRef.current = false;
            onComplete();
          }, 150);
        }
      }, 300); // Let the view stabilize after animation
    });
  }, [flyToLocation, setAutoRotation, isFlyingRef, cancelFlight, camera, controlsRef]);
  
  return {
    enhancedFlyToLocation,
    isFlyingRef,
    cancelFlight
  };
}
