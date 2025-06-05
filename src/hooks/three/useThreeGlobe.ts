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
  const isCleaningUpRef = useRef<boolean>(false);
  const setupAttemptedRef = useRef<boolean>(false);
  
  // Use the scene hook
  const {
    scene,
    camera,
    renderer,
    controls: existingControls,
    isInitialized: sceneInitialized,
    animationFrameRef,
    controlsRef
  } = useThreeScene(containerRef);

  // Track if textures are loaded
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [globeInitialized, setGlobeInitialized] = useState(false);
  
  // Setup globe objects and controls
  useEffect(() => {
    // Wait for scene to be ready and prevent multiple setups
    if (!sceneInitialized || !scene || !camera || !renderer || setupAttemptedRef.current || isCleaningUpRef.current) {
      if (!sceneInitialized) {
        console.log("Three.js scene not yet initialized, waiting...");
      } else if (setupAttemptedRef.current) {
        console.log("Globe setup already attempted");
      }
      return;
    }
    
    console.log("Setting up globe objects and controls");
    setupAttemptedRef.current = true;
    
    try {
      // Clear any previous starfield or elements
      const childrenToRemove = scene.children.filter(child => 
        child instanceof THREE.Points || 
        (child instanceof THREE.Mesh && child.userData.type === 'starfield')
      );
      childrenToRemove.forEach(child => scene.remove(child));
      
      // Add starfield background
      createStarfield(scene);
      console.log("Starfield added to scene");
      
      // Set up lighting
      setupLighting(scene);
      console.log("Lighting setup complete");
      
      // Create Earth globe
      const { globeGroup, earthMesh, setTexturesLoaded: updateTextureLoadStatus } = createEarthGlobe(scene);
      if (globeGroup && earthMesh) {
        globeGroup.rotation.y = Math.PI;
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
      } else {
        console.error("Failed to create globe group or earth mesh");
        setupAttemptedRef.current = false; // Allow retry
        return;
      }
      
      // Create atmosphere
      const atmosphere = createAtmosphere(scene);
      atmosphereRef.current = atmosphere;
      console.log("Atmosphere added to scene");
      
      // Configure controls with auto-rotation enabled
      if (controlsRef.current) {
        configureControls(controlsRef.current, camera);
        controlsRef.current.autoRotate = true;
        autoRotationEnabledRef.current = true;
        console.log("Controls configured");
      } else {
        console.warn("Controls not available for configuration");
      }
      
      console.log("Globe setup complete, starting animation");
      setGlobeInitialized(true);
      
      // Start animation loop with proper checks
      const animate = () => {
        // Check if we're cleaning up or if required objects are missing
        if (isCleaningUpRef.current || 
            !scene || 
            !camera || 
            !renderer ||
            !setupAttemptedRef.current) {
          console.log("Animation loop stopping - missing required objects or cleaning up");
          return;
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
        
        // Update controls if available
        if (controlsRef.current) {
          try {
            controlsRef.current.update();
            renderer.render(scene, camera);
          } catch (error) {
            console.error("Error in animation loop:", error);
            // Stop animation if there's an error
            return;
          }
        }
      };
      
      // Start animation
      animate();
      
      // Call onInitialized after a short delay to ensure everything is ready
      setTimeout(() => {
        if (!isCleaningUpRef.current && setupAttemptedRef.current) {
          console.log("Globe initialization complete, calling onInitialized");
          if (onInitialized) {
            onInitialized();
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error during globe setup:", error);
      setupAttemptedRef.current = false; // Allow retry on error
    }
    
    // Cleanup function
    return () => {
      console.log("Globe effect cleanup");
      isCleaningUpRef.current = true;
      
      // Stop animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
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
      setupAttemptedRef.current = false;
      setGlobeInitialized(false);
      setTexturesLoaded(false);
    };
  }, [sceneInitialized, scene, camera, renderer, animationFrameRef, controlsRef, onInitialized]);
  
  // Enable/disable auto-rotation
  const setAutoRotation = useCallback((enabled: boolean) => {
    if (controlsRef.current && !isCleaningUpRef.current) {
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
    if (isCleaningUpRef.current) return;
    
    // Ensure the globe is rotating while flying for a more dynamic effect
    setAutoRotation(true);
    
    // Call the original flyToLocation
    flyToLocation(longitude, latitude, () => {
      // Keep auto-rotation on after flying
      setAutoRotation(true);
      
      if (onComplete) onComplete();
    });
  }, [flyToLocation, setAutoRotation]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCleaningUpRef.current = true;
    };
  }, []);
  
  return {
    scene,
    camera,
    renderer,
    controls: controlsRef.current,
    globe: globeRef.current,
    isInitialized: globeInitialized,
    flyToLocation: enhancedFlyToLocation,
    setAutoRotation
  };
}
