
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FlightAnimation } from './types';

/**
 * Hook for managing flight animation frames
 */
export function useFlightAnimation() {
  // Animation frame reference to ensure proper cleanup
  const animationFrameRef = useRef<number | null>(null);
  const animationInProgressRef = useRef<boolean>(false);
  
  // Cancel any ongoing animation
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    animationInProgressRef.current = false;
  }, []);

  // Animate camera outward (first stage)
  const animateCameraOutward = useCallback((
    timestamp: number,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    startPosition: THREE.Vector3,
    outerPosition: THREE.Vector3,
    startTime: { current: number | null },
    handleMainAnimation: (timestamp: number) => void
  ) => {
    if (!animationInProgressRef.current) {
      return;
    }
    
    if (!camera || !controls) {
      animationInProgressRef.current = false;
      return;
    }
    
    if (startTime.current === null) startTime.current = timestamp;
    const elapsed = timestamp - startTime.current;
    const progress = Math.min(elapsed / 300, 1); // Fast initial outward movement
    
    // Simple ease-out for quick outward movement
    const ease = 1 - Math.pow(1 - progress, 2);
    
    // Interpolate camera position from current to outer space
    camera.position.lerpVectors(startPosition, outerPosition, ease);
    
    // Update controls
    controls.update();
    
    // Continue animation if not complete
    if (progress < 1 && animationInProgressRef.current) {
      animationFrameRef.current = requestAnimationFrame((ts) => 
        animateCameraOutward(ts, camera, controls, startPosition, outerPosition, startTime, handleMainAnimation)
      );
    } else {
      // Start the main animation once we're in outer space
      startTime.current = null; // Reset for main animation
      animationFrameRef.current = requestAnimationFrame(handleMainAnimation);
    }
  }, []);

  // Main animation function
  const animateCamera = useCallback((
    timestamp: number,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    animation: FlightAnimation,
    startTime: { current: number | null },
    onComplete?: () => void
  ) => {
    // Check if animation should continue
    if (!animationInProgressRef.current) {
      console.log("Animation canceled due to component unmounting or new animation");
      if (onComplete) onComplete();
      return;
    }
    
    // Check if camera and controls still exist
    if (!camera || !controls) {
      console.warn("Camera or controls no longer exist during animation");
      animationInProgressRef.current = false;
      if (onComplete) onComplete();
      return;
    }
    
    if (startTime.current === null) startTime.current = timestamp;
    const elapsed = timestamp - startTime.current;
    const progress = Math.min(elapsed / animation.duration, 1);
    
    // Custom easing function for smoother animation with initial slow motion
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const ease = easeInOutCubic(progress);
    
    // Interpolate camera position from outer space to final position
    camera.position.lerpVectors(animation.outerPosition, animation.finalPosition, ease);
    
    // Gradually transition the controls target from Earth center to the specific location
    const newTarget = new THREE.Vector3();
    newTarget.lerpVectors(animation.currentTarget, animation.finalTarget, ease);
    controls.target.copy(newTarget);
    
    // Make sure the camera is looking at the appropriate point during animation
    camera.lookAt(newTarget);
    controls.update();
    
    // Continue animation if not complete
    if (progress < 1 && animationInProgressRef.current) {
      animationFrameRef.current = requestAnimationFrame((ts) => 
        animateCamera(ts, camera, controls, animation, startTime, onComplete)
      );
    } else {
      // Animation complete
      animationFrameRef.current = null;
      animationInProgressRef.current = false;
      
      // Restore controls settings
      if (controls) {
        controls.enableDamping = animation.wasDamping;
        
        // Delay auto-rotation restart slightly to avoid jump
        setTimeout(() => {
          if (controls && animation.wasAutoRotating) {
            controls.autoRotate = true;
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
  }, []);

  return {
    animationFrameRef,
    animationInProgressRef,
    cancelAnimation,
    animateCameraOutward,
    animateCamera
  };
}
