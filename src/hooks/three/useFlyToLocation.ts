
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
    const distance = globeRadius * 1.2; // Closer to the surface for better view
    const cameraTargetX = -distance * Math.sin(phi) * Math.cos(theta);
    const cameraTargetY = distance * Math.cos(phi);
    const cameraTargetZ = distance * Math.sin(phi) * Math.sin(theta);
    
    const currentPos = cameraRef.current.position.clone();
    const targetPos = new THREE.Vector3(cameraTargetX, cameraTargetY, cameraTargetZ);
    
    // Save the current target of the controls
    const currentTarget = controlsRef.current.target.clone();
    const finalTarget = new THREE.Vector3(targetX * 0.2, targetY * 0.2, targetZ * 0.2);
    
    // Disable auto-rotation during transition
    const wasAutoRotating = controlsRef.current.autoRotate;
    controlsRef.current.autoRotate = false;
    
    // Animate camera position
    let startTime: number | null = null;
    const duration = 1500; // Faster animation (1.5 seconds)
    
    const animateCamera = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use ease-out cubic function for smoother landing
      const ease = 1 - Math.pow(1 - progress, 3);
      
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
        // Only re-enable auto-rotation if it was on before
        if (controlsRef.current && wasAutoRotating) {
          controlsRef.current.autoRotate = true;
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
