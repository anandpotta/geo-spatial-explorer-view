
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { toast } from '@/components/ui/use-toast';

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
  const retryAttemptsRef = useRef<number>(0);
  
  // Method to fly to a specific location on the globe
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    if (!cameraRef.current || !controlsRef.current) {
      console.warn("Camera or controls not ready yet, will retry in a moment");
      
      // Retry a few times before giving up
      if (retryAttemptsRef.current < 3) {
        retryAttemptsRef.current++;
        
        setTimeout(() => {
          flyToLocation(longitude, latitude, onComplete);
        }, 500);
        return;
      } else {
        console.error("Camera still not initialized after delay, cannot navigate");
        toast({
          title: "Navigation Error",
          description: "Couldn't initialize camera for navigation",
          variant: "destructive"
        });
        if (onComplete) onComplete();
        return;
      }
    }
    
    // Reset retry counter on successful attempt
    retryAttemptsRef.current = 0;
    
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
    
    // Start the camera from a farther position for dramatic effect
    const startDistance = globeRadius * 6; // Far away from globe
    const finalDistance = globeRadius * 1.25; // Close to the location point
    
    // Ensure we have valid current positions before proceeding
    if (!cameraRef.current.position) {
      console.error("Camera position is null or undefined");
      if (onComplete) onComplete();
      return;
    }
    
    // Calculate initial distant camera position (from space)
    const earthCenter = new THREE.Vector3(0, 0, 0);
    const directionToTarget = new THREE.Vector3().subVectors(target, earthCenter).normalize();
    
    // Save current camera position for smoother transition
    const startPosition = cameraRef.current.position.clone();
    
    // Position camera in space looking at Earth 
    const outerPosition = new THREE.Vector3().copy(directionToTarget).multiplyScalar(startDistance);
    
    // Ensure controls target is not null
    if (!controlsRef.current.target) {
      console.error("OrbitControls target is null");
      controlsRef.current.target = new THREE.Vector3(0, 0, 0);
    }
    
    // Save the current target of the controls
    const currentTarget = controlsRef.current.target.clone();
    
    // Set the target to be slightly closer to the surface for better viewing
    const finalTarget = target.clone().multiplyScalar(0.99);
    
    // Temporarily disable auto-rotation and damping during transition for precision
    const wasAutoRotating = controlsRef.current.autoRotate;
    const wasDamping = controlsRef.current.enableDamping;
    controlsRef.current.autoRotate = false;
    controlsRef.current.enableDamping = false;
    
    // Animate camera position
    let startTime: number | null = null;
    const duration = 2500; // Longer animation for dramatic effect
    animationInProgressRef.current = true;
    
    // First stage: move camera out to space if not already there (quick transition)
    const animateCameraOutward = (timestamp: number) => {
      if (!animationInProgressRef.current) {
        return;
      }
      
      if (!cameraRef.current || !controlsRef.current) {
        animationInProgressRef.current = false;
        if (onComplete) onComplete();
        return;
      }
      
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / 300, 1); // Fast initial outward movement
      
      // Simple ease-out for quick outward movement
      const ease = 1 - Math.pow(1 - progress, 2);
      
      // Interpolate camera position from current to outer space
      cameraRef.current.position.lerpVectors(startPosition, outerPosition, ease);
      
      // Update controls
      controlsRef.current.update();
      
      // Continue animation if not complete
      if (progress < 1 && animationInProgressRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateCameraOutward);
      } else {
        // Start the main animation once we're in outer space
        startTime = null; // Reset for main animation
        animationFrameRef.current = requestAnimationFrame(animateCamera);
      }
    };
    
    // Main animation function
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
      
      // Custom easing function for smoother animation with initial slow motion
      const easeInOutCubic = (t: number): number => {
        return t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      
      const ease = easeInOutCubic(progress);
      
      // Interpolate camera position from outer space to final position
      cameraRef.current.position.lerpVectors(outerPosition, finalPosition, ease);
      
      // Gradually transition the controls target from Earth center to the specific location
      const newTarget = new THREE.Vector3();
      newTarget.lerpVectors(currentTarget, finalTarget, ease);
      controlsRef.current.target.copy(newTarget);
      
      // Make sure the camera is looking at the appropriate point during animation
      cameraRef.current.lookAt(newTarget);
      controlsRef.current.update();
      
      // Continue animation if not complete
      if (progress < 1 && animationInProgressRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateCamera);
      } else {
        // Animation complete
        animationFrameRef.current = null;
        animationInProgressRef.current = false;
        
        // Restore controls settings
        if (controlsRef.current) {
          controlsRef.current.enableDamping = wasDamping;
          
          // Delay auto-rotation restart slightly to avoid jump
          setTimeout(() => {
            if (controlsRef.current && wasAutoRotating) {
              controlsRef.current.autoRotate = true;
            }
          }, 200);
        }
        
        // Wait for a moment for the view to stabilize before triggering callbacks
        setTimeout(() => {
          if (onComplete) {
            console.log("Fly animation complete, calling completion callback");
            onComplete();
          }
        }, 300); // Increased from 100ms to 300ms for better stability
      }
    };
    
    // Start animation with outward movement first
    animationFrameRef.current = requestAnimationFrame(animateCameraOutward);
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
