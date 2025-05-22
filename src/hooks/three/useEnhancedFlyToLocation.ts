
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
    };
  }, [cancelFlight]);
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Cancel any ongoing flight first
    cancelFlight();
    
    // Set flying state to true to prevent animation conflicts
    isFlyingRef.current = true;
    
    // Log the navigation attempt
    console.log(`EnhancedFlyToLocation: Flying to ${latitude}, ${longitude}`);
    
    // Temporarily disable auto-rotation for smoother flight
    setAutoRotation(false);
    
    // Call the original flyToLocation
    flyToLocation(longitude, latitude, () => {
      // Mark flying as complete
      isFlyingRef.current = false;
      
      // Small delay before re-enabling rotation for smoother transition
      setTimeout(() => {
        // Re-enable auto-rotation with a smooth start
        setAutoRotation(true);
        
        console.log(`EnhancedFlyToLocation: Flight completed to ${latitude}, ${longitude}`);
        
        // Ensure the onComplete callback is called
        if (onComplete) {
          console.log("EnhancedFlyToLocation: Calling onComplete callback");
          onComplete();
        }
      }, 500);
    });
  }, [flyToLocation, setAutoRotation, isFlyingRef, cancelFlight]);
  
  return {
    enhancedFlyToLocation,
    isFlyingRef,
    cancelFlight
  };
}
