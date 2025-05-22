
import { useRef, useEffect } from 'react';
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
  const isAnimatingRef = useRef<boolean>(true);
  const lastTimeRef = useRef<number>(0);
  
  // Setup and handle the animation loop
  useEffect(() => {
    if (!scene || !camera || !renderer || !controlsRef.current) {
      console.log("Animation cannot start - missing required objects");
      return;
    }
    
    console.log("Starting globe animation loop");
    isAnimatingRef.current = true;
    
    // Animation function with time delta for smoother animations
    const animate = (time: number) => {
      // Check if animation should continue
      if (!isAnimatingRef.current) {
        return;
      }
      
      if (!scene || !camera || !renderer || !controlsRef.current) {
        console.warn("Animation loop missing required objects");
        return;
      }
      
      const delta = (time - lastTimeRef.current) * 0.001; // Convert to seconds
      lastTimeRef.current = time;
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // If auto rotation is enabled and not flying to a location
      if (autoRotationEnabledRef.current && !isFlyingRef.current) {
        // Use delta time for smoother rotation regardless of frame rate
        if (controlsRef.current.autoRotateSpeed) {
          const rotationAmount = controlsRef.current.autoRotateSpeed * delta * 0.1;
          controlsRef.current.rotateLeft(rotationAmount);
        }
        
        // Let the orbit controls handle other updates
        controlsRef.current.update();
      } else if (controlsRef.current) {
        // Still update controls for other interactions
        controlsRef.current.update();
      }
      
      // Ensure the renderer is drawing the scene with high quality
      if (renderer) {
        renderer.render(scene, camera);
      }
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      isAnimatingRef.current = false;
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      console.log("Globe animation loop stopped");
    };
  }, [scene, camera, renderer, controlsRef, autoRotationEnabledRef, isFlyingRef]);
  
  return {
    animationFrameRef,
    isAnimatingRef
  };
}
