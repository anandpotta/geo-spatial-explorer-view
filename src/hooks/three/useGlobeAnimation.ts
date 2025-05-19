
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
    const animate = () => {
      // Check if unmounted
      if (!mountedRef.current) {
        cleanup();
        return;
      }
      
      // Request next frame first to ensure smoother animation
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Check if all required objects are still available
      if (!scene || !camera || !renderer || !controlsRef.current) {
        console.warn("Animation loop missing required objects");
        cleanup();
        return;
      }
      
      try {
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
        cleanup();
      }
    };
    
    // Start animation
    animate();
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [scene, camera, renderer, controlsRef, autoRotationEnabledRef, isFlyingRef, cleanup]);
  
  // Handle unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);
  
  return {
    animationFrameRef,
    cleanup
  };
}
