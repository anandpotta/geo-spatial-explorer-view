import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './useThreeScene';
import { useFlyToLocation } from './useFlyToLocation';
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
  const autoRotationEnabledRef = useRef<boolean>(true);
  
  // Use the scene hook
  const {
    scene,
    camera,
    renderer,
    controls: existingControls,
    isInitialized,
    setIsInitialized,
    animationFrameRef,
    canvasElementRef,
    controlsRef
  } = useThreeScene(containerRef);

  // Track if textures are loaded
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  // Setup globe objects and controls
  useEffect(() => {
    if (!scene || !camera || !renderer) {
      console.log("Scene, camera or renderer not available yet");
      return;
    }
    
    console.log("Setting up globe objects and controls");
    
    // Clear any previous starfield or elements
    scene.children.forEach(child => {
      if (child instanceof THREE.Points || 
          (child instanceof THREE.Mesh && child.userData.type === 'starfield')) {
        scene.remove(child);
      }
    });
    
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
    
    // Configure controls with auto-rotation enabled
    if (controlsRef.current) {
      configureControls(controlsRef.current, camera);
      controlsRef.current.autoRotate = true;
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
      
      // If we have a globe, rotate it slightly for a more dynamic appearance
      if (globeRef.current && autoRotationEnabledRef.current) {
        // The globe rotation is now handled by OrbitControls autoRotate
        // but we could add additional rotation effects here if needed
      }
      
      // Make sure controls are updated every frame
      controlsRef.current.update();
      
      // Ensure the renderer is drawing the scene
      renderer.render(scene, camera);
    };
    
    // Start animation
    animate();
    
    // Mark as initialized when everything is ready
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // Cleanup function
    return () => {
      console.log("Globe effect cleanup");
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
  }, [scene, camera, renderer, setIsInitialized, animationFrameRef, controlsRef, isInitialized]);
  
  // Call onInitialized when textures are loaded
  useEffect(() => {
    if (texturesLoaded && onInitialized) {
      console.log("Calling onInitialized callback - textures loaded");
      onInitialized();
    }
  }, [texturesLoaded, onInitialized]);
  
  // Enable/disable auto-rotation
  const setAutoRotation = useCallback((enabled: boolean) => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = enabled;
      autoRotationEnabledRef.current = enabled;
    }
  }, [controlsRef]);
  
  // Get flyToLocation functionality
  const { flyToLocation } = useFlyToLocation(
    { current: camera }, // Wrap camera in an object with current property to match MutableRefObject type
    controlsRef,
    EARTH_RADIUS
  );
  
  // Wrap the flyToLocation to handle auto-rotation
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Ensure the globe is rotating while flying for a more dynamic effect
    setAutoRotation(true);
    
    // Call the original flyToLocation
    flyToLocation(longitude, latitude, () => {
      // Keep auto-rotation on after flying
      setAutoRotation(true);
      
      if (onComplete) onComplete();
    });
  }, [flyToLocation, setAutoRotation]);
  
  return {
    scene,
    camera,
    renderer,
    controls: controlsRef.current,
    globe: globeRef.current,
    isInitialized,
    flyToLocation: enhancedFlyToLocation,
    setAutoRotation
  };
}
