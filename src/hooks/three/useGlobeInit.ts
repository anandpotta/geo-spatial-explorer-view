
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useGlobeSetup } from './useGlobeSetup';
import { useGlobeAnimation } from './useGlobeAnimation';
import { EARTH_RADIUS } from '@/utils/three/globe-factory';

/**
 * Hook for initializing the globe and related components
 */
export function useGlobeInit(
  scene: THREE.Scene | null,
  camera: THREE.PerspectiveCamera | null,
  renderer: THREE.WebGLRenderer | null,
  controlsRef: React.RefObject<any>,
  containerRef: React.RefObject<HTMLDivElement>,
  autoRotationEnabledRef: React.RefObject<boolean>,
  isFlyingRef: React.RefObject<boolean>,
  onTexturesLoaded?: () => void
) {
  const globeRef = useRef<any>(null);
  
  // Use globe setup hook with texture callback
  const { globe, cleanup: globeCleanup } = useGlobeSetup(
    scene,
    camera,
    controlsRef,
    containerRef,
    onTexturesLoaded
  );
  
  // Store globe reference
  if (globe && !globeRef.current) {
    globeRef.current = globe;
  }
  
  // Set up animation loop
  const { cleanup: animationCleanup } = useGlobeAnimation(
    scene,
    camera,
    renderer,
    controlsRef,
    autoRotationEnabledRef,
    isFlyingRef
  );
  
  // Initialize renderer settings when available
  const setupRenderer = useCallback(() => {
    if (renderer) {
      // Set pixel ratio for better quality on high-DPI displays
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)); // Limit to 2x for performance
      
      // Enable shadow mapping for more realistic rendering
      renderer.shadowMap.enabled = true;
      
      // Force a render to ensure the scene appears
      if (scene && camera) {
        renderer.render(scene, camera);
      }
    }
  }, [renderer, scene, camera]);
  
  return {
    globe: globeRef.current || globe,
    setupRenderer,
    cleanup: useCallback(() => {
      animationCleanup();
      globeCleanup();
    }, [animationCleanup, globeCleanup])
  };
}
