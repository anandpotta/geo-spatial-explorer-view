
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
  
  // Helper to validate coordinates
  const isValidCoordinate = (value: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  };
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Validate coordinates before attempting to fly
    if (!isValidCoordinate(longitude) || !isValidCoordinate(latitude)) {
      console.error(`Invalid coordinates: longitude=${longitude}, latitude=${latitude}`);
      if (onComplete) onComplete();
      return;
    }
    
    // Set flying state to true to prevent animation conflicts
    isFlyingRef.current = true;
    
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
        
        if (onComplete) onComplete();
      }, 500);
    });
  }, [flyToLocation, setAutoRotation, isFlyingRef]);
  
  return {
    enhancedFlyToLocation,
    isFlyingRef
  };
}
