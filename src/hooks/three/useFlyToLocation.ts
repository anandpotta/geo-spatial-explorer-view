
import { useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Hook providing functionality to fly to a specific location on the globe
 */
export function useFlyToLocation(
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>,
  controlsRef: React.MutableRefObject<OrbitControls | null>,
  globeRadius: number
) {
  // Method to fly to a specific location on the globe
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    if (!cameraRef.current || !controlsRef.current) {
      if (onComplete) onComplete();
      return;
    }
    
    // Convert lat/long to 3D coordinates
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    
    const targetX = -globeRadius * Math.sin(phi) * Math.cos(theta);
    const targetY = globeRadius * Math.cos(phi);
    const targetZ = globeRadius * Math.sin(phi) * Math.sin(theta);
    
    const target = new THREE.Vector3(targetX, targetY, targetZ);
    
    // Calculate camera position (slightly away from the target point)
    const distance = globeRadius * 1.5;
    const cameraTargetX = -distance * Math.sin(phi) * Math.cos(theta);
    const cameraTargetY = distance * Math.cos(phi);
    const cameraTargetZ = distance * Math.sin(phi) * Math.sin(theta);
    
    const currentPos = cameraRef.current.position.clone();
    const targetPos = new THREE.Vector3(cameraTargetX, cameraTargetY, cameraTargetZ);
    
    // Disable auto-rotation during transition
    controlsRef.current.autoRotate = false;
    
    // Animate camera position
    let startTime: number | null = null;
    const duration = 2000; // ms
    
    const animateCamera = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease function (cubic)
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Interpolate position
      const newX = currentPos.x + (targetPos.x - currentPos.x) * ease;
      const newY = currentPos.y + (targetPos.y - currentPos.y) * ease;
      const newZ = currentPos.z + (targetPos.z - currentPos.z) * ease;
      
      // Update camera
      if (cameraRef.current) {
        cameraRef.current.position.set(newX, newY, newZ);
        cameraRef.current.lookAt(0, 0, 0);
      }
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // Animation complete
        // Re-enable auto-rotation
        if (controlsRef.current) {
          controlsRef.current.autoRotate = true;
        }
        
        if (onComplete) {
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
