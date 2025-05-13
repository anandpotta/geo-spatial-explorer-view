
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
  const isFlyingRef = useRef<boolean>(false);
  
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
  
  // Flag to prevent multiple initializations
  const isSetupCompleteRef = useRef(false);
  
  // Store markers
  const markersRef = useRef<Map<string, THREE.Mesh>>(new Map());
  
  // Setup globe objects and controls
  useEffect(() => {
    if (!scene || !camera || !renderer || isSetupCompleteRef.current) {
      console.log("Scene not ready or setup already complete");
      return;
    }
    
    console.log("Setting up globe objects and controls");
    isSetupCompleteRef.current = true;
    
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
    
    // Configure controls with improved settings for smoother experience
    if (controlsRef.current) {
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
      if (!isInitialized) {
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
  }, [scene, camera, renderer, setIsInitialized, animationFrameRef, controlsRef, isInitialized, onInitialized, texturesLoaded]);
  
  // Call onInitialized when textures are loaded
  useEffect(() => {
    if (texturesLoaded && onInitialized && isInitialized) {
      console.log("Calling onInitialized callback - textures loaded");
      onInitialized();
    }
  }, [texturesLoaded, onInitialized, isInitialized]);
  
  // Enable/disable auto-rotation with smoother transitions
  const setAutoRotation = useCallback((enabled: boolean) => {
    if (controlsRef.current) {
      if (enabled && !controlsRef.current.autoRotate) {
        // When enabling, start with a slower speed and gradually increase
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.1;
        
        // Gradually increase rotation speed
        const increaseSpeed = () => {
          if (controlsRef.current && controlsRef.current.autoRotateSpeed < 0.3) {
            controlsRef.current.autoRotateSpeed += 0.05;
            setTimeout(increaseSpeed, 100);
          }
        };
        setTimeout(increaseSpeed, 100);
      } else {
        controlsRef.current.autoRotate = enabled;
      }
      autoRotationEnabledRef.current = enabled;
    }
  }, [controlsRef]);
  
  // Get flyToLocation functionality
  const { flyToLocation } = useFlyToLocation(
    { current: camera }, // Wrap camera in an object with current property to match MutableRefObject type
    controlsRef,
    EARTH_RADIUS
  );
  
  // Wrap the flyToLocation to handle auto-rotation and flying state
  const enhancedFlyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    // Set flying state to true to prevent animation conflicts
    isFlyingRef.current = true;
    
    // Temporarily disable auto-rotation for smoother flight
    setAutoRotation(false);
    
    // Call the original flyToLocation
    flyToLocation(longitude, latitude, () => {
      // Mark flying as complete
      isFlyingRef.current = false;
      
      // Small delay before re-enabling rotation for smoother transition
      setTimeout(() => {
        // Re-enable auto-rotation with a smooth start
        setAutoRotation(true);
        
        if (onComplete) onComplete();
      }, 500);
    });
  }, [flyToLocation, setAutoRotation]);
  
  // Add marker at specific coordinates
  const addMarker = useCallback((id: string, position: THREE.Vector3, label?: string) => {
    if (!scene) return;
    
    // Remove existing marker with the same ID if it exists
    if (markersRef.current.has(id)) {
      const existingMarker = markersRef.current.get(id);
      if (existingMarker) {
        scene.remove(existingMarker);
      }
      markersRef.current.delete(id);
    }
    
    // Create marker geometry
    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Set position
    marker.position.copy(position);
    
    // Add to scene
    scene.add(marker);
    
    // Store in markers map
    markersRef.current.set(id, marker);
    
    // If there's a label, add it
    if (label) {
      console.log(`Added marker for: ${label}`);
    }
    
    return marker;
  }, [scene]);
  
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
