
import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Hook to create and manage Three.js OrbitControls
 */
export function useThreeControls() {
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // Create controls
  const createControls = useCallback((camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) => {
    if (!camera || !canvas) {
      console.warn("Camera or canvas not available for Three.js controls");
      return null;
    }
    
    // Create orbit controls
    const controls = new OrbitControls(camera, canvas);
    controlsRef.current = controls;
    console.log("OrbitControls created");
    
    return controls;
  }, []);
  
  // Dispose controls
  const disposeControls = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
      console.log("Controls disposed");
    }
  }, []);
  
  return {
    controlsRef,
    createControls,
    disposeControls
  };
}
