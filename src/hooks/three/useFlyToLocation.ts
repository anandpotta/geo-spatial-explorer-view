
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
  // Animation frame reference to ensure proper cleanup
  const animationFrameRef = useRef<number | null>(null);
  const animationInProgressRef = useRef<boolean>(false);
  
  // Method to fly to a specific location on the globe
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    if (!cameraRef.current || !controlsRef.current) {
      console.warn("Cannot fly to location - camera or controls not initialized");
      if (onComplete) onComplete();
      return;
    }
    
    // Validate inputs to avoid NaN errors
    if (isNaN(longitude) || isNaN(latitude)) {
      console.error(`Invalid coordinates: longitude=${longitude}, latitude=${latitude}`);
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`Flying to location: ${latitude}, ${longitude}`);
    
    // Cancel any existing animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // IMPORTANT: Convert lat/long to radians for correct positioning
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = longitude * (Math.PI / 180);
    
    // Calculate the point on the globe's surface
    const targetX = -globeRadius * Math.sin(phi) * Math.cos(theta);
    const targetY = globeRadius * Math.cos(phi);
    const targetZ = globeRadius * Math.sin(phi) * Math.sin(theta);
    
    const target = new THREE.Vector3(targetX, targetY, targetZ);
    
    // Calculate camera position at a good distance for viewing the location
    // Position the camera closer to the globe's surface for a more detailed view
    const finalDistance = globeRadius * 1.5; // Closer to the location point
    
    const cameraTargetX = -finalDistance * Math.sin(phi) * Math.cos(theta);
    const cameraTargetY = finalDistance * Math.cos(phi);
    const cameraTargetZ = finalDistance * Math.sin(phi) * Math.sin(theta);
    
    // Ensure we have valid current positions before proceeding
    if (!cameraRef.current.position) {
      console.error("Camera position is null or undefined");
      if (onComplete) onComplete();
      return;
    }
    
    const currentPos = cameraRef.current.position.clone();
    const targetPos = new THREE.Vector3(cameraTargetX, cameraTargetY, cameraTargetZ);
    
    // Ensure controls target is not null
    if (!controlsRef.current.target) {
      console.error("OrbitControls target is null");
      controlsRef.current.target = new THREE.Vector3(0, 0, 0);
    }
    
    // Save the current target of the controls with null check
    const currentTarget = controlsRef.current.target.clone();
    
    // Set the target to be slightly closer to the surface for better viewing
    // This makes the camera look at the actual surface location
    const finalTarget = target.clone().multiplyScalar(0.99);
    
    // Temporarily disable auto-rotation and damping during transition for precision
    const wasAutoRotating = controlsRef.current.autoRotate;
    const wasDamping = controlsRef.current.enableDamping;
    controlsRef.current.autoRotate = false;
    controlsRef.current.enableDamping = false;
    
    // Animate camera position
    let startTime: number | null = null;
    const duration = 2000; // 2 seconds for a smooth flight
    animationInProgressRef.current = true;
    
    const animateCamera = (timestamp: number) => {
      // Check if animation should continue
      if (!animationInProgressRef.current) {
        console.log("Animation canceled due to component unmounting or new animation");
        if (onComplete) onComplete();
        return;
      }
      
      // Check if camera and controls still exist
      if (!cameraRef.current || !controlsRef.current) {
        console.warn("Camera or controls no longer exist during animation");
        animationInProgressRef.current = false;
        if (onComplete) onComplete();
        return;
      }
      
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use smooth easing functions for better animation
      const easeInOutCubic = (t: number): number => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      
      const ease = easeInOutCubic(progress);
      
      // Interpolate camera position
      const newX = currentPos.x + (targetPos.x - currentPos.x) * ease;
      const newY = currentPos.y + (targetPos.y - currentPos.y) * ease;
      const newZ = currentPos.z + (targetPos.z - currentPos.z) * ease;
      
      // Interpolate target (where the camera is looking)
      const newTargetX = currentTarget.x + (finalTarget.x - currentTarget.x) * ease;
      const newTargetY = currentTarget.y + (finalTarget.y - currentTarget.y) * ease;
      const newTargetZ = currentTarget.z + (finalTarget.z - currentTarget.z) * ease;
      
      try {
        // Update camera with null checks
        if (cameraRef.current && cameraRef.current.position) {
          cameraRef.current.position.set(newX, newY, newZ);
        }
        
        if (controlsRef.current && controlsRef.current.target) {
          controlsRef.current.target.set(newTargetX, newTargetY, newTargetZ);
          controlsRef.current.update();
        }
      } catch (error) {
        console.error("Error during camera animation:", error);
        animationInProgressRef.current = false;
        if (onComplete) onComplete();
        return;
      }
      
      // Continue animation if not complete
      if (progress < 1 && animationInProgressRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateCamera);
      } else {
        // Animation complete
        animationFrameRef.current = null;
        animationInProgressRef.current = false;
        
        // Restore controls settings with null checks
        if (controlsRef.current) {
          controlsRef.current.enableDamping = wasDamping;
          
          // Delay auto-rotation restart slightly to avoid jump
          setTimeout(() => {
            if (controlsRef.current && wasAutoRotating) {
              controlsRef.current.autoRotate = true;
            }
          }, 300);
        }
        
        if (onComplete) {
          console.log("Fly animation complete, calling completion callback");
          onComplete();
        }
      }
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animateCamera);
  }, [cameraRef, controlsRef, globeRadius]);
  
  // Return the flyToLocation function and cleanup helper
  return {
    flyToLocation,
    cancelFlight: useCallback(() => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      animationInProgressRef.current = false;
    }, []),
    animationInProgressRef
  };
}
