
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { disposeObject3D } from '@/utils/three-utils';
import { 
  createEarthGlobe, 
  createAtmosphere, 
  setupLighting,
  configureControls,
  EARTH_RADIUS
} from '@/utils/three/globe-factory';
import { createStarfield } from '@/utils/three/texture-loader';
import { useGlobeTextures } from './useGlobeTextures';

export function useGlobeSetup(
  scene: THREE.Scene | null,
  camera: THREE.PerspectiveCamera | null,
  controlsRef: React.RefObject<any>,
  containerRef: React.RefObject<HTMLDivElement>,
  onTexturesLoaded: () => void
) {
  // Globe-specific refs
  const globeRef = useRef<THREE.Group | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const starfieldRef = useRef<THREE.Points | null>(null);
  const mountedRef = useRef<boolean>(true);
  
  // Flag to prevent multiple initializations
  const isSetupCompleteRef = useRef(false);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("Globe effect cleanup");
    isSetupCompleteRef.current = false;
    
    // Dispose globe and atmosphere meshes
    if (globeRef.current && scene) {
      scene.remove(globeRef.current);
      disposeObject3D(globeRef.current);
      globeRef.current = null;
    }
    
    if (atmosphereRef.current && scene) {
      scene.remove(atmosphereRef.current);
      disposeObject3D(atmosphereRef.current);
      atmosphereRef.current = null;
    }
    
    if (starfieldRef.current && scene) {
      scene.remove(starfieldRef.current);
      disposeObject3D(starfieldRef.current);
      starfieldRef.current = null;
    }
    
    earthMeshRef.current = null;
  }, [scene]);
  
  // Setup globe objects and controls
  useEffect(() => {
    if (!scene || !camera || isSetupCompleteRef.current || !containerRef.current || !mountedRef.current) {
      console.log("Scene not ready or setup already complete");
      return;
    }
    
    console.log("Setting up globe objects and controls");
    isSetupCompleteRef.current = true;
    
    // Add starfield background
    const starfield = createStarfield(scene);
    starfieldRef.current = starfield;
    
    // Set up lighting
    setupLighting(scene);
    
    // Create Earth globe
    const { globeGroup, earthMesh } = createEarthGlobe(scene);
    if (globeGroup) {
      globeGroup.rotation.y = Math.PI;
      scene.add(globeGroup); // Add to scene
      globeRef.current = globeGroup;
      earthMeshRef.current = earthMesh;
      
      console.log("Globe created and added to scene");
    }
    
    // Create atmosphere
    const atmosphere = createAtmosphere(scene);
    atmosphereRef.current = atmosphere;
    
    // Configure controls with improved settings for smoother experience
    if (controlsRef.current && camera) {
      configureControls(controlsRef.current, camera);
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.3; // Slower rotation for smoother appearance
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.1; // Increased damping for smoother stops
      controlsRef.current.rotateSpeed = 0.4; // Slower rotation for more precise control
    }
    
    // Cleanup function
    return () => {
      cleanup();
    };
  }, [scene, camera, controlsRef, containerRef, cleanup]);
  
  // Handle unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);
  
  // Use the texture hook
  const { texturesLoaded, handleTextureLoading, cleanup: texturesCleanup } = useGlobeTextures(
    earthMeshRef.current,
    onTexturesLoaded
  );
  
  return {
    globe: globeRef.current,
    texturesLoaded,
    cleanup: useCallback(() => {
      texturesCleanup();
      cleanup();
    }, [texturesCleanup, cleanup])
  };
}
