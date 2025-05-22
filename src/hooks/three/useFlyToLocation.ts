
import { useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useFlightAnimation } from './flight/useFlightAnimation';
import { useFlightCoordinates } from './flight/useFlightCoordinates';
import { useRetryStrategy } from './flight/useRetryStrategy';
import { FlightControlRefs } from './flight/types';

/**
 * Hook providing functionality to fly to a specific location on the globe
 */
export function useFlyToLocation(
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null> | {
    current: THREE.PerspectiveCamera | null;
  },
  controlsRef: React.MutableRefObject<OrbitControls | null>,
  globeRadius: number
) {
  // Get flight utilities from separated hooks
  const { maybeRetry, resetRetryCount } = useRetryStrategy({ cameraRef, controlsRef });
  const { validateCoordinates, calculateTargetPosition, calculateCameraPositions } = useFlightCoordinates(globeRadius);
  const { animationFrameRef, animationInProgressRef, cancelAnimation, animateCameraOutward, animateCamera } = useFlightAnimation();
  
  // Method to fly to a specific location on the globe
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Check if camera and controls are initialized
    if (!cameraRef.current || !controlsRef.current) {
      return maybeRetry(longitude, latitude, (lon, lat) => flyToLocation(lon, lat, onComplete), onComplete);
    }
    
    // Reset retry counter on successful attempt
    resetRetryCount();
    
    // Validate input coordinates
    if (!validateCoordinates(longitude, latitude)) {
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`Flying to location: ${latitude}, ${longitude}`);
    
    // Cancel any existing animation frame
    cancelAnimation();

    // Calculate the target position on the globe's surface
    const target = calculateTargetPosition(longitude, latitude);
    
    // Ensure we have valid current positions before proceeding
    if (!cameraRef.current.position) {
      console.error("Camera position is null or undefined");
      if (onComplete) onComplete();
      return;
    }
    
    // Save current camera position for smoother transition
    const startPosition = cameraRef.current.position.clone();
    
    // Calculate camera positions for the animation
    const { outerPosition, finalPosition } = calculateCameraPositions(target, startPosition);
    
    // Ensure controls target is not null
    if (!controlsRef.current.target) {
      console.error("OrbitControls target is null");
      controlsRef.current.target = new THREE.Vector3(0, 0, 0);
    }
    
    // Save the current target of the controls
    const currentTarget = controlsRef.current.target.clone();
    
    // Set the target to be slightly closer to the surface for better viewing
    const finalTarget = target.clone().multiplyScalar(0.99);
    
    // Record control settings to restore later
    const wasAutoRotating = controlsRef.current.autoRotate;
    const wasDamping = controlsRef.current.enableDamping;
    
    // Temporarily disable auto-rotation and damping during transition for precision
    controlsRef.current.autoRotate = false;
    controlsRef.current.enableDamping = false;
    
    // Animation state variables
    const startTime = { current: null as number | null };
    animationInProgressRef.current = true;
    
    // Create animation configuration object
    const animationConfig = {
      startPosition,
      outerPosition,
      finalPosition,
      currentTarget,
      finalTarget,
      duration: 2500, // Longer animation for dramatic effect
      wasAutoRotating,
      wasDamping
    };

    // Create wrapped animation handlers
    const handleMainAnimation = (timestamp: number) => {
      animateCamera(
        timestamp,
        cameraRef.current!,
        controlsRef.current!,
        animationConfig,
        startTime,
        onComplete
      );
    };
    
    // Start animation with outward movement first
    animationFrameRef.current = requestAnimationFrame((timestamp) => {
      animateCameraOutward(
        timestamp,
        cameraRef.current!,
        controlsRef.current!,
        startPosition,
        outerPosition,
        startTime,
        handleMainAnimation
      );
    });
  }, [
    cameraRef,
    controlsRef,
    globeRadius,
    maybeRetry,
    resetRetryCount,
    validateCoordinates,
    calculateTargetPosition,
    calculateCameraPositions,
    cancelAnimation,
    animationFrameRef,
    animationInProgressRef,
    animateCameraOutward,
    animateCamera
  ]);
  
  // Return the flyToLocation function and cleanup helper
  return {
    flyToLocation,
    cancelFlight: cancelAnimation,
    animationInProgressRef
  };
}
