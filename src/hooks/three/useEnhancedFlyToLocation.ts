
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
  const cleanupFnRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef<boolean>(true);
  
  // Determine which ref to use for tracking flying state
  const isFlyingRef = externalFlyingRef || internalFlyingRef;
  
  // Get auto-rotation controls
  const { setAutoRotation } = useAutoRotation(controlsRef);
  
  // Use a camera ref to match the expected type in useFlyToLocation
  const cameraRefWrapper = useRef<THREE.PerspectiveCamera | null>(camera);
  
  // Update the camera ref when camera changes
  useEffect(() => {
    cameraRefWrapper.current = camera;
  }, [camera]);
  
  // Get basic flyToLocation from useFlyToLocation
  const { flyToLocation, cleanup } = useFlyToLocation(
    cameraRefWrapper, 
    controlsRef,
    globeRadius
  );
  
  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
      }
      cleanup();
      mountedRef.current = false;
    };
  }, [cleanup]);
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Check if component is still mounted
    if (!mountedRef.current) return;
    
    // Clean up any previous flight
    if (cleanupFnRef.current) {
      cleanupFnRef.current();
      cleanupFnRef.current = null;
    }
    
    // Set flying state to true to prevent animation conflicts
    isFlyingRef.current = true;
    
    // Temporarily disable auto-rotation for smoother flight
    setAutoRotation(false);
    
    // Pre-trigger callback with minimal delay so UI can prepare for transition sooner
    // This helps start the map preparation earlier for a more seamless experience
    const preTransitionTimeout = setTimeout(() => {
      if (isFlyingRef.current && mountedRef.current) {
        // Signal that we're about to complete the fly (this primes the UI)
        console.log('Pre-triggering transition preparation');
      }
    }, 1000); // Short pre-trigger for UI preparation
    
    // Safety timeout for flight completion
    const flyCompletionTimeout = setTimeout(() => {
      // If the flight doesn't complete in 6 seconds (reduced from 8), force completion
      if (isFlyingRef.current && mountedRef.current) {
        console.log('Flight timeout exceeded, forcing completion');
        isFlyingRef.current = false;
        clearTimeout(preTransitionTimeout);
        
        if (onComplete && mountedRef.current) onComplete();
      }
    }, 6000); // Reduced timeout for better responsiveness
    
    try {
      // Call the original flyToLocation with enhanced completion handling
      const flightCleanupFn = flyToLocation(longitude, latitude, () => {
        // Make sure component is still mounted
        if (!mountedRef.current) return;
        
        // Mark flying as complete
        isFlyingRef.current = false;
        
        // Clear the safety timeouts
        clearTimeout(flyCompletionTimeout);
        clearTimeout(preTransitionTimeout);
        
        // Immediate callback to prevent delay in transition
        if (onComplete && mountedRef.current) onComplete();
        
        // Small delay before re-enabling rotation for smoother transition
        setTimeout(() => {
          if (mountedRef.current) {
            // Re-enable auto-rotation with a smooth start
            setAutoRotation(true);
          }
        }, 500);
      });
      
      // Store cleanup function
      if (flightCleanupFn) {
        cleanupFnRef.current = flightCleanupFn;
      }
    } catch (error) {
      console.error("Error during flight:", error);
      
      // Handle errors gracefully
      isFlyingRef.current = false;
      clearTimeout(preTransitionTimeout);
      clearTimeout(flyCompletionTimeout);
      
      // Call the completion callback anyway to prevent UI getting stuck
      if (onComplete && mountedRef.current) onComplete();
      
      // Re-enable auto-rotation
      setTimeout(() => {
        if (mountedRef.current) setAutoRotation(true);
      }, 500);
    }
  }, [flyToLocation, setAutoRotation, isFlyingRef]);
  
  return {
    enhancedFlyToLocation,
    isFlyingRef,
    cleanup
  };
}
