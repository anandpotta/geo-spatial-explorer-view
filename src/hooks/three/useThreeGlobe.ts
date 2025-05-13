
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './useThreeScene';
import { useAutoRotation } from './useAutoRotation';
import { useEnhancedFlyToLocation } from './useEnhancedFlyToLocation';
import { useMarkers } from './useMarkers';
import { disposeObject3D } from '@/utils/three-utils';
import { 
  createEarthGlobe, 
  createAtmosphere, 
  setupLighting,
  configureControls,
  EARTH_RADIUS
} from '@/utils/three/globe-factory';
import { loadEarthTextures, createStarfield } from '@/utils/three/texture-loader';

export function useThreeGlobe(
  containerRef: React.RefObject<HTMLDivElement>,
  onInitialized?: () => void
) {
  // Globe-specific refs
  const globeRef = useRef<THREE.Group | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  
  // Use the scene hook
  const {
    scene,
    camera,
    renderer,
    isInitialized,
    setIsInitialized,
    animationFrameRef,
    canvasElementRef,
    controlsRef
  } = useThreeScene(containerRef);

  // Track if textures are loaded
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  // Flag to prevent multiple initializations
  const isSetupCompleteRef = useRef(false);
  
  // Get auto-rotation functionality
  const { autoRotationEnabledRef, setAutoRotation } = useAutoRotation(controlsRef);
  
  // Get markers functionality
  const { addMarker } = useMarkers(scene);
  
  // Get enhanced fly to location functionality
  const { enhancedFlyToLocation, isFlyingRef } = useEnhancedFlyToLocation(
    camera,
    controlsRef,
    EARTH_RADIUS
  );
  
  // Setup globe objects and controls
  useEffect(() => {
    if (!scene || !camera || !renderer || isSetupCompleteRef.current || !containerRef.current) {
      console.log("Scene not ready or setup already complete");
      return;
    }
    
    console.log("Setting up globe objects and controls");
    isSetupCompleteRef.current = true;
    
    // Clear any previous scene elements
    while (scene.children.length > 0) {
      const child = scene.children[0];
      scene.remove(child);
      if (child instanceof THREE.Object3D) {
        disposeObject3D(child);
      }
    }
    
    // Add starfield background
    createStarfield(scene);
    
    // Set up lighting
    setupLighting(scene);
    
    // Create Earth globe
    const { globeGroup, earthMesh, setTexturesLoaded: updateTextureLoadStatus } = createEarthGlobe(scene);
    if (globeGroup) {
      globeGroup.rotation.y = Math.PI;
      scene.add(globeGroup); // Add to scene
      globeRef.current = globeGroup;
      earthMeshRef.current = earthMesh;
      
      console.log("Globe created and added to scene");
      
      // Load textures
      loadEarthTextures(earthMesh.material as THREE.MeshPhongMaterial, (earthLoaded, bumpLoaded) => {
        const allLoaded = updateTextureLoadStatus(earthLoaded, bumpLoaded);
        if (allLoaded) {
          console.log("All Earth textures loaded successfully");
          setTexturesLoaded(true);
        }
      });
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
      autoRotationEnabledRef.current = true;
    }
    
    console.log("Globe setup complete, starting animation");
    
    // Start animation loop
    const animate = () => {
      if (!scene || !camera || !renderer || !controlsRef.current) {
        console.warn("Animation loop missing required objects");
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // If we have a globe and auto rotation is enabled (and not flying to a location)
      if (globeRef.current && autoRotationEnabledRef.current && !isFlyingRef.current) {
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
    
    // Mark as initialized after a small timeout to ensure everything is ready
    setTimeout(() => {
      if (!isInitialized && containerRef.current) {
        console.log("Setting isInitialized to true");
        setIsInitialized(true);
        
        // Even if textures are still loading, we'll consider the globe ready
        // to avoid getting stuck at the loading screen
        if (!texturesLoaded && onInitialized) {
          console.log("Calling onInitialized even though textures aren't fully loaded");
          onInitialized();
        }
      }
    }, 2000); // Give it 2 seconds to load, then move on regardless
    
    // Cleanup function
    return () => {
      console.log("Globe effect cleanup");
      isSetupCompleteRef.current = false;
      
      // Dispose globe and atmosphere meshes
      if (globeRef.current) {
        scene.remove(globeRef.current);
        disposeObject3D(globeRef.current);
        globeRef.current = null;
      }
      
      if (atmosphereRef.current) {
        scene.remove(atmosphereRef.current);
        disposeObject3D(atmosphereRef.current);
        atmosphereRef.current = null;
      }
      
      earthMeshRef.current = null;
    };
  }, [scene, camera, renderer, setIsInitialized, animationFrameRef, controlsRef, isInitialized, onInitialized, texturesLoaded, containerRef]);
  
  // Call onInitialized when textures are loaded
  useEffect(() => {
    if (texturesLoaded && onInitialized && isInitialized) {
      console.log("Calling onInitialized callback - textures loaded");
      onInitialized();
    }
  }, [texturesLoaded, onInitialized, isInitialized]);
  
  return {
    scene,
    camera,
    renderer,
    controls: controlsRef.current,
    globe: globeRef.current,
    isInitialized,
    flyToLocation: enhancedFlyToLocation,
    setAutoRotation,
    addMarker
  };
}
