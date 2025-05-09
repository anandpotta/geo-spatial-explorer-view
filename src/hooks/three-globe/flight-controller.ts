
import * as THREE from 'three';
import { FlyingState, EARTH_RADIUS } from './types';
import { easeInOutCubic } from './utils';

/**
 * Update the flying animation state
 */
export function updateFlyingAnimation(
  flyingStateRef: React.MutableRefObject<FlyingState>,
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>
): void {
  const { 
    startPosition, 
    targetPosition, 
    startTime, 
    duration, 
    onComplete 
  } = flyingStateRef.current;
  
  const camera = cameraRef.current;
  if (!camera) return;
  
  const now = Date.now();
  const elapsed = now - startTime;
  const progress = Math.min(elapsed / duration, 1.0);
  
  // Use an easing function for smoother animation
  const easeProgress = easeInOutCubic(progress);
  
  // Interpolate camera position
  camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
  
  // Look at the earth center during flight
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  
  // If animation is complete
  if (progress >= 1.0) {
    flyingStateRef.current.isFlying = false;
    if (onComplete) onComplete();
  }
}

/**
 * Set up flying to a specific latitude and longitude with enhanced cinematic animation
 */
export function setupFlyToLocation(
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>,
  globeRef: React.MutableRefObject<THREE.Mesh | null>,
  flyingStateRef: React.MutableRefObject<FlyingState>
): (longitude: number, latitude: number, onComplete?: () => void, duration?: number) => void {
  
  return (longitude: number, latitude: number, onComplete?: () => void, duration = 2500): void => {
    if (!cameraRef.current || !globeRef.current) return;
    
    // Convert the latitude and longitude to a 3D position
    const phi = (90 - latitude) * Math.PI / 180;
    const theta = (longitude + 180) * Math.PI / 180;
    
    // Calculate position on globe
    const x = -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
    const y = EARTH_RADIUS * Math.cos(phi);
    const z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
    
    const targetPointOnGlobe = new THREE.Vector3(x, y, z);
    
    // Adjust the globe's rotation to make the target point face the camera
    globeRef.current.rotation.y = theta;
    globeRef.current.rotation.x = phi - Math.PI/2;
    
    // Set up the camera position for flying animation
    const startPosition = cameraRef.current.position.clone();
    
    // First, move slightly outward from current position for cinematic effect
    const midwayPoint = startPosition.clone().multiplyScalar(1.3);
    setTimeout(() => {
      // Then animate to the destination with a curved path
      
      // Target position should be closer to the surface for a more immersive landing
      const direction = targetPointOnGlobe.clone().normalize();
      const targetCameraPosition = direction.multiplyScalar(EARTH_RADIUS * 1.5); // Closer to surface
      
      // Store the animation state
      flyingStateRef.current = {
        ...flyingStateRef.current,
        isFlying: true,
        startPosition: cameraRef.current?.position.clone() || midwayPoint,
        targetPosition: targetCameraPosition,
        startTime: Date.now(),
        duration: duration,
        onComplete,
      };
      
      console.log('Starting enhanced cinematic flight to:', { longitude, latitude });
    }, 800); // Short delay before targeting destination
    
    // First move outward
    flyingStateRef.current = {
      ...flyingStateRef.current,
      isFlying: true,
      startPosition,
      targetPosition: midwayPoint,
      startTime: Date.now(),
      duration: 800, // Quick outward movement
      onComplete: undefined, // No callback yet
    };
  };
}
