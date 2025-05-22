
import { useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFlyToLocation } from './useFlyToLocation';
import { useAutoRotation } from './useAutoRotation';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
    };
  }, [cancelFlight]);
  
  // Watch animation state and trigger callback when animation finishes
  useEffect(() => {
    if (!animationInProgressRef.current && isFlyingRef.current && completedCallbackRef.current) {
      const callback = completedCallbackRef.current;
      // Reset state before calling callback to prevent infinite loops
      isFlyingRef.current = false;
      completedCallbackRef.current = undefined;
      
      // Call the callback after a small delay to ensure everything is settled
      setTimeout(() => {
        if (callback) {
          console.log("Fly animation complete, calling completion callback");
          callback();
        }
      }, 100);
    }
  }, [animationInProgressRef.current, isFlyingRef]);
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Cancel any ongoing flight first
    cancelFlight();
    
    // Set flying state to true to prevent animation conflicts
    isFlyingRef.current = true;
    
    // Store the callback for later
    completedCallbackRef.current = onComplete;
    
    // Log the navigation attempt
    console.log(`EnhancedFlyToLocation: Flying to ${latitude}, ${longitude}`);
    
    // Temporarily disable auto-rotation for smoother flight
    setAutoRotation(false);
    
    // Call the original flyToLocation with an internal callback
    flyToLocation(longitude, latitude, () => {
      // This will be called when the flight animation completes
      console.log(`EnhancedFlyToLocation: Flight completed to ${latitude}, ${longitude}`);
      
      // Re-enable auto-rotation with a smooth start after a delay
      setTimeout(() => {
        setAutoRotation(true);
      }, 500);
      
      // The main callback will be called through the effect watching animationInProgressRef
    });
  }, [flyToLocation, setAutoRotation, isFlyingRef, cancelFlight]);
  
  return {
    enhancedFlyToLocation,
    isFlyingRef,
    cancelFlight
  };
}
