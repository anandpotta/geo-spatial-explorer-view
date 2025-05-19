
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Hook to provide flying to a specific location on the globe
 */
export function useFlyToLocation(
  cameraRef: React.RefObject<THREE.PerspectiveCamera>,
  controlsRef: React.RefObject<OrbitControls>,
  globeRadius: number = 1
) {
  // Animation refs
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const animationDurationRef = useRef<number>(2000); // 2 seconds animation duration
  
  // Cleanup function to cancel any ongoing animation
  const cleanup = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      animationStartTimeRef.current = null;
    }
  }, []);
  
  // Calculate target position on the globe based on latitude and longitude
  const getTargetPosition = useCallback((longitude: number, latitude: number): THREE.Vector3 => {
    // Convert to radians
    const latRad = (latitude * Math.PI) / 180;
    const lonRad = (longitude * Math.PI) / 180;
    
    // Calculate position
    const x = -globeRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = globeRadius * Math.sin(latRad);
    const z = globeRadius * Math.cos(latRad) * Math.sin(lonRad);
    
    return new THREE.Vector3(x, y, z);
  }, [globeRadius]);
  
  // Calculate camera position with an offset from the target position
  const getCameraPosition = useCallback((targetPosition: THREE.Vector3): THREE.Vector3 => {
    // Create a position that is at an offset from the target
    const offsetFactor = 1.8; // Distance multiplier from globe surface
    return targetPosition.clone().multiplyScalar(offsetFactor);
  }, []);
  
  // Animate camera movement using requestAnimationFrame
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void): (() => void) => {
    if (!cameraRef.current || !controlsRef.current) {
      console.warn("Camera or controls not available for fly animation");
      if (onComplete) onComplete();
      return () => {};
    }
    
    // Calculate target position on globe
    const targetPosition = getTargetPosition(longitude, latitude);
    
    // Calculate camera position
    const targetCameraPosition = getCameraPosition(targetPosition);
    
    console.log(`Flying to location: ${longitude}, ${latitude}`);
    
    // Store initial camera position and rotation
    const startPosition = cameraRef.current.position.clone();
    const startRotation = new THREE.Quaternion().setFromEuler(cameraRef.current.rotation.clone());
    
    // Store target rotation (looking at the target)
    const lookAtVector = new THREE.Vector3().copy(targetPosition);
    const tempCamera = cameraRef.current.clone();
    tempCamera.position.copy(targetCameraPosition);
    tempCamera.lookAt(lookAtVector);
    const targetRotation = new THREE.Quaternion().setFromEuler(tempCamera.rotation);
    
    // Clean up any existing animation
    cleanup();
    
    // Get the current time
    animationStartTimeRef.current = Date.now();
    
    // Animation function
    const animateCamera = () => {
      if (!cameraRef.current || !controlsRef.current) {
        console.warn("Camera or controls no longer exist during animation");
        cleanup();
        if (onComplete) onComplete();
        return;
      }
      
      const currentTime = Date.now();
      const startTime = animationStartTimeRef.current || currentTime;
      const elapsed = currentTime - startTime;
      const duration = animationDurationRef.current;
      
      // Calculate progress (0 to 1)
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother animation (ease-out)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate position
      const newPosition = new THREE.Vector3().lerpVectors(
        startPosition,
        targetCameraPosition,
        easeOutProgress
      );
      
      // Interpolate rotation
      const newRotation = new THREE.Quaternion().slerpQuaternions(
        startRotation,
        targetRotation,
        easeOutProgress
      );
      
      // Apply new position and rotation
      cameraRef.current.position.copy(newPosition);
      cameraRef.current.quaternion.copy(newRotation);
      
      // Update controls target to look at the location on the globe
      controlsRef.current.target.copy(targetPosition);
      
      // Update controls
      try {
        controlsRef.current.update();
      } catch (error) {
        console.error("Error updating controls during animation:", error);
      }
      
      // If animation is complete
      if (progress >= 1) {
        console.log("Fly animation complete, calling completion callback");
        cleanup();
        
        // Ensure controls are pointing at the target
        if (controlsRef.current) {
          controlsRef.current.target.copy(targetPosition);
          controlsRef.current.update();
        }
        
        // Call completion callback
        if (onComplete) onComplete();
      } else {
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animateCamera);
      }
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animateCamera);
    
    // Return a function to cancel animation if needed
    return cleanup;
  }, [cameraRef, controlsRef, getTargetPosition, getCameraPosition, cleanup]);
  
  return {
    flyToLocation,
    cleanup
  };
}
