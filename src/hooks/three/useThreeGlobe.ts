
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';
import { useThreeScene } from './useThreeScene';
import { useFlyToLocation } from './useFlyToLocation';
import { disposeObject3D } from '@/utils/three-utils';

// Earth radius in km (scaled)
const EARTH_RADIUS = 5;
// Distance to show the full Earth
const OUTER_SPACE_DISTANCE = EARTH_RADIUS * 4;
// Closest distance to Earth's surface
const MIN_DISTANCE = EARTH_RADIUS * 1.2;

export function useThreeGlobe(
  containerRef: React.RefObject<HTMLDivElement>,
  onInitialized?: () => void
) {
  // Globe-specific refs
  const globeRef = useRef<THREE.Mesh | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  
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
  
  // Setup globe objects and controls
  useEffect(() => {
    if (!scene || !camera || !renderer) return;
    
    const options = createThreeViewerOptions();
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(
      options.lights.ambient.color,
      options.lights.ambient.intensity
    );
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(
      options.lights.directional.color,
      options.lights.directional.intensity
    );
    directionalLight.position.copy(options.lights.directional.position);
    scene.add(directionalLight);
    
    // Create Earth globe
    const globeGeometry = new THREE.SphereGeometry(
      options.globe.radius,
      options.globe.segments,
      options.globe.segments
    );
    
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: options.globe.baseColor,
      shininess: 5,
      flatShading: false
    });
    
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);
    globeRef.current = globe;
    
    // Create atmosphere
    if (options.globe.enableAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(
        options.globe.radius * 1.05,
        options.globe.segments,
        options.globe.segments
      );
      
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: options.globe.atmosphereColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);
      atmosphereRef.current = atmosphere;
    }
    
    // Set up controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = MIN_DISTANCE;
    controls.maxDistance = OUTER_SPACE_DISTANCE;
    controls.enablePan = false;
    controls.autoRotate = options.globe.enableRotation;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;
    
    // Start animation loop
    const animate = () => {
      if (!scene || !camera || !renderer || !controlsRef.current) {
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
      controlsRef.current.update();
      renderer.render(scene, camera);
    };
    
    // Start animation
    animate();
    
    // Mark as initialized
    setIsInitialized(true);
    if (onInitialized) {
      onInitialized();
    }
    
    // Cleanup function
    return () => {
      // Dispose globe and atmosphere meshes
      if (globeRef.current) {
        disposeObject3D(globeRef.current);
        globeRef.current = null;
      }
      
      if (atmosphereRef.current) {
        disposeObject3D(atmosphereRef.current);
        atmosphereRef.current = null;
      }
    };
  }, [scene, camera, renderer, onInitialized, setIsInitialized, animationFrameRef, controlsRef]);
  
  // Get flyToLocation functionality
  const { flyToLocation } = useFlyToLocation(camera, controlsRef, EARTH_RADIUS);
  
  return {
    scene,
    camera,
    renderer,
    controls: controlsRef.current,
    globe: globeRef.current,
    isInitialized,
    flyToLocation
  };
}
