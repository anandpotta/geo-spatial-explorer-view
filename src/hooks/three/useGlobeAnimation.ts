
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

export function useGlobeAnimation(
  scene: THREE.Scene | null,
  camera: THREE.PerspectiveCamera | null,
  renderer: THREE.WebGLRenderer | null,
  controlsRef: React.RefObject<any>,
  autoRotationEnabledRef: React.RefObject<boolean>,
  isFlyingRef: React.RefObject<boolean>
) {
  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastFrameTimeRef = useRef<number>(0);
  
  // Cleanup function to cancel animation frame
  const cleanup = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);
  
  // Setup and handle the animation loop
  useEffect(() => {
    if (!scene || !camera || !renderer) {
      console.log("Animation cannot start - missing required objects");
      return cleanup;
    }
    
    // Make sure controls exist
    if (!controlsRef.current) {
      console.log("Animation cannot start - missing controls");
      return cleanup;
    }
    
    console.log("Starting globe animation loop");
    
    // Animation function with safety checks
    const animate = (timestamp: number) => {
      // Check if unmounted
      if (!mountedRef.current) {
        cleanup();
        return;
      }
      
      // Throttle frame rate slightly for better performance
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < 16) { // cap at ~60fps
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = timestamp;
      
      // Request next frame first to ensure smoother animation
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Check if all required objects are still available
      if (!scene || !camera || !renderer || !controlsRef.current) {
        console.warn("Animation loop missing required objects");
        cleanup();
        return;
      }
      
      try {
        // Skip rendering if document is not visible (tab is inactive)
        if (document.hidden) {
          return;
        }
        
        // If auto rotation is enabled and not flying to a location
        if (autoRotationEnabledRef.current && !isFlyingRef.current) {
          // Let the orbit controls handle rotation
          controlsRef.current.update();
        } else if (controlsRef.current) {
          // Still update controls for other interactions
          controlsRef.current.update();
        }
        
        // Ensure the renderer is drawing the scene with high quality
        if (renderer && renderer.domElement && renderer.domElement.parentElement) {
          renderer.render(scene, camera);
        }
      } catch (error) {
        console.error("Error in animation loop:", error);
        // Don't immediately clean up on error, try to continue
        // This makes the animation more robust
      }
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [scene, camera, renderer, controlsRef, autoRotationEnabledRef, isFlyingRef, cleanup]);
  
  return {
    animationFrameRef,
    cleanup
  };
}
