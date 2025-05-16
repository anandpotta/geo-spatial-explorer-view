
import { useCallback, useRef } from 'react';
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
  const { flyToLocation } = useFlyToLocation(
    { current: camera }, // Wrap camera in an object with current property to match MutableRefObject type
    controlsRef,
    globeRadius
  );
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Set flying state to true to prevent animation conflicts
    isFlyingRef.current = true;
    
    // Temporarily disable auto-rotation for smoother flight
    setAutoRotation(false);
    
    // Pre-trigger callback with minimal delay so UI can prepare for transition sooner
    // This helps start the map preparation earlier for a more seamless experience
    const preTransitionTimeout = setTimeout(() => {
      if (isFlyingRef.current) {
        // Signal that we're about to complete the fly (this primes the UI)
        console.log('Pre-triggering transition preparation');
      }
    }, 1000); // Short pre-trigger for UI preparation
    
    // Clear any existing flight completion callbacks
    const flyCompletionTimeout = setTimeout(() => {
      // If the flight doesn't complete in 6 seconds (reduced from 8), force completion
      if (isFlyingRef.current) {
        console.log('Flight timeout exceeded, forcing completion');
        isFlyingRef.current = false;
        clearTimeout(preTransitionTimeout);
        
        if (onComplete) onComplete();
      }
    }, 6000); // Reduced timeout for better responsiveness
    
    // Call the original flyToLocation with enhanced completion handling
    flyToLocation(longitude, latitude, () => {
      // Mark flying as complete
      isFlyingRef.current = false;
      
      // Clear the safety timeouts
      clearTimeout(flyCompletionTimeout);
      clearTimeout(preTransitionTimeout);
      
      // Immediate callback to prevent delay in transition
      if (onComplete) onComplete();
      
      // Small delay before re-enabling rotation for smoother transition
      setTimeout(() => {
        // Re-enable auto-rotation with a smooth start
        setAutoRotation(true);
      }, 500);
    });
  }, [flyToLocation, setAutoRotation, isFlyingRef]);
  
  return {
    enhancedFlyToLocation,
    isFlyingRef
  };
}
