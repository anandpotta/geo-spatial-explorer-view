
import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';

/**
 * Hook to create and manage the Three.js camera
 */
export function useThreeCamera(
  containerRef: React.RefObject<HTMLDivElement>
) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Create camera
  const createCamera = useCallback(() => {
    if (!containerRef.current) {
      console.warn("Container ref not available for Three.js camera");
      return null;
    }
    
    const options = createThreeViewerOptions();
    
    // Get dimensions from container
    const { clientWidth, clientHeight } = containerRef.current;
    
    // Ensure valid dimensions - use minimum values if we get zeros
    const width = clientWidth || 800; 
    const height = clientHeight || 600;
    
    console.log(`Creating camera with dimensions: ${width}x${height}`);
    
    // Create perspective camera
    const camera = new THREE.PerspectiveCamera(
      options.cameraOptions.fov,
      width / height,
      options.cameraOptions.near,
      options.cameraOptions.far
    );
    
    // Set initial position
    camera.position.copy(options.cameraOptions.position);
    cameraRef.current = camera;
    
    return camera;
  }, [containerRef]);
  
  // Update camera aspect ratio
  const updateCameraAspect = useCallback(() => {
    if (!containerRef.current || !cameraRef.current) return;
    
    // Get new dimensions
    const { clientWidth, clientHeight } = containerRef.current;
    
    // Ensure valid dimensions
    const width = clientWidth || 800;
    const height = clientHeight || 600;
    
    // Update camera aspect ratio
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [containerRef, cameraRef]);
  
  return {
    cameraRef,
    createCamera,
    updateCameraAspect
  };
}
