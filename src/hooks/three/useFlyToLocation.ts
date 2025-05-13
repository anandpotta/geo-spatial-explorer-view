
import { useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Define a type that accepts either a direct camera instance or a React ref to a camera
type CameraRefType = React.MutableRefObject<THREE.PerspectiveCamera | null> | {
  current: THREE.PerspectiveCamera | null;
};

/**
 * Hook providing functionality to fly to a specific location on the globe
 */
export function useFlyToLocation(
  cameraRef: CameraRefType,
  controlsRef: React.MutableRefObject<OrbitControls | null>,
  globeRadius: number
) {
  // Method to fly to a specific location on the globe
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    if (!cameraRef.current || !controlsRef.current) {
      console.warn("Cannot fly to location - camera or controls not initialized");
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`Flying to location: ${latitude}, ${longitude}`);
    
    // Convert lat/long to 3D coordinates
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    
    // Calculate the point on the globe's surface
    const targetX = -globeRadius * Math.sin(phi) * Math.cos(theta);
    const targetY = globeRadius * Math.cos(phi);
    const targetZ = globeRadius * Math.sin(phi) * Math.sin(theta);
    
    const target = new THREE.Vector3(targetX, targetY, targetZ);
    
    // Calculate camera position (at a specified distance from the target point)
    const distance = globeRadius * 1.5; // Slightly further for smoother view
    const cameraTargetX = -distance * Math.sin(phi) * Math.cos(theta);
    const cameraTargetY = distance * Math.cos(phi);
    const cameraTargetZ = distance * Math.sin(phi) * Math.sin(theta);
    
    const currentPos = cameraRef.current.position.clone();
    const targetPos = new THREE.Vector3(cameraTargetX, cameraTargetY, cameraTargetZ);
    
    // Save the current target of the controls
    const currentTarget = controlsRef.current.target.clone();
    const finalTarget = new THREE.Vector3(targetX * 0.2, targetY * 0.2, targetZ * 0.2);
    
    // Temporarily disable auto-rotation and damping during transition for precision
    const wasAutoRotating = controlsRef.current.autoRotate;
    const wasDamping = controlsRef.current.enableDamping;
    controlsRef.current.autoRotate = false;
    controlsRef.current.enableDamping = false;
    
    // Animate camera position
    let startTime: number | null = null;
    const duration = 2000; // Slower animation (2 seconds) for smoother movement
    
    const animateCamera = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use custom easing function for smoother motion
      // This is a combination of ease-out-cubic at start and ease-in-cubic near end
      let ease;
      if (progress < 0.5) {
        // First half: accelerate out of starting position (ease-out-cubic)
        ease = 0.5 * (1 - Math.pow(1 - 2 * progress, 3));
      } else {
        // Second half: decelerate into final position (ease-in-out)
        ease = 0.5 * (1 + Math.pow(2 * progress - 1, 3));
      }
      
      // Interpolate camera position
      const newX = currentPos.x + (targetPos.x - currentPos.x) * ease;
      const newY = currentPos.y + (targetPos.y - currentPos.y) * ease;
      const newZ = currentPos.z + (targetPos.z - currentPos.z) * ease;
      
      // Interpolate target (where the camera is looking)
      const newTargetX = currentTarget.x + (finalTarget.x - currentTarget.x) * ease;
      const newTargetY = currentTarget.y + (finalTarget.y - currentTarget.y) * ease;
      const newTargetZ = currentTarget.z + (finalTarget.z - currentTarget.z) * ease;
      
      // Update camera
      if (cameraRef.current) {
        cameraRef.current.position.set(newX, newY, newZ);
        controlsRef.current!.target.set(newTargetX, newTargetY, newTargetZ);
        controlsRef.current!.update();
      }
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // Animation complete
        // Restore controls settings
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
    requestAnimationFrame(animateCamera);
  }, [cameraRef, controlsRef, globeRadius]);
  
  return {
    flyToLocation
  };
}
