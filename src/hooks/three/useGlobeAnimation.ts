
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
  
  // Setup and handle the animation loop
  useEffect(() => {
    if (!scene || !camera || !renderer || !controlsRef.current) {
      console.log("Animation cannot start - missing required objects");
      return;
    }
    
    console.log("Starting globe animation loop");
    
    // Animation function
    const animate = () => {
      if (!scene || !camera || !renderer || !controlsRef.current) {
        console.warn("Animation loop missing required objects");
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // If auto rotation is enabled and not flying to a location
      if (autoRotationEnabledRef.current && !isFlyingRef.current) {
        // Let the orbit controls handle rotation
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
    animate();
    
    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [scene, camera, renderer, controlsRef, autoRotationEnabledRef, isFlyingRef]);
  
  return {
    animationFrameRef
  };
}
