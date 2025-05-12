
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';

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
  // Core Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Clean up resources
  const cleanup = useCallback(() => {
    console.log("Three.js cleanup starting");
    
    // Cancel any animation frames
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Dispose of controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    
    // Dispose of globe mesh and materials
    if (globeRef.current) {
      if (globeRef.current.geometry) {
        globeRef.current.geometry.dispose();
      }
      if (globeRef.current.material) {
        if (Array.isArray(globeRef.current.material)) {
          globeRef.current.material.forEach(m => m.dispose());
        } else {
          globeRef.current.material.dispose();
        }
      }
      globeRef.current = null;
    }
    
    // Dispose of atmosphere mesh
    if (atmosphereRef.current) {
      if (atmosphereRef.current.geometry) {
        atmosphereRef.current.geometry.dispose();
      }
      if (atmosphereRef.current.material) {
        if (Array.isArray(atmosphereRef.current.material)) {
          atmosphereRef.current.material.forEach(m => m.dispose());
        } else {
          atmosphereRef.current.material.dispose();
        }
      }
      atmosphereRef.current = null;
    }
    
    // Dispose of all scene objects
    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }
    
    // Clean up renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      
      // Only try to remove the canvas if it exists and has a parent
      if (canvasElementRef.current && canvasElementRef.current.parentNode) {
        try {
          canvasElementRef.current.parentNode.removeChild(canvasElementRef.current);
        } catch (e) {
          console.warn("Could not remove canvas from parent:", e);
        }
      }
      
      rendererRef.current = null;
      canvasElementRef.current = null;
    }
    
    console.log("Three.js cleanup complete");
  }, []);
  
  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up any previous instance
    cleanup();
    
    const options = createThreeViewerOptions();
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = options.backgroundColor;
    
    // Create camera
    const { clientWidth, clientHeight } = containerRef.current;
    const camera = new THREE.PerspectiveCamera(
      options.cameraOptions.fov,
      clientWidth / clientHeight,
      options.cameraOptions.near,
      options.cameraOptions.far
    );
    camera.position.copy(options.cameraOptions.position);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: options.rendering.antialias,
      alpha: options.rendering.alpha,
      preserveDrawingBuffer: options.rendering.preserveDrawingBuffer,
      powerPreference: options.rendering.powerPreference as WebGLPowerPreference,
    });
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Append renderer to container
    containerRef.current.appendChild(renderer.domElement);
    canvasElementRef.current = renderer.domElement;
    
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
    
    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    globeRef.current = globe;
    
    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !controlsRef.current) {
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    
    // Start animation
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const { clientWidth, clientHeight } = containerRef.current;
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(clientWidth, clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Mark as initialized
    setIsInitialized(true);
    if (onInitialized) {
      onInitialized();
    }
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [containerRef, onInitialized, cleanup]);
  
  // Method to fly to a specific location on the globe
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    if (!globeRef.current || !cameraRef.current || !controlsRef.current) {
      if (onComplete) onComplete();
      return;
    }
    
    // Convert lat/long to 3D coordinates
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    
    const targetX = -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
    const targetY = EARTH_RADIUS * Math.cos(phi);
    const targetZ = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
    
    const target = new THREE.Vector3(targetX, targetY, targetZ);
    
    // Calculate camera position (slightly away from the target point)
    const distance = EARTH_RADIUS * 1.5;
    const cameraTargetX = -distance * Math.sin(phi) * Math.cos(theta);
    const cameraTargetY = distance * Math.cos(phi);
    const cameraTargetZ = distance * Math.sin(phi) * Math.sin(theta);
    
    const currentPos = cameraRef.current.position.clone();
    const targetPos = new THREE.Vector3(cameraTargetX, cameraTargetY, cameraTargetZ);
    
    // Disable auto-rotation during transition
    controlsRef.current.autoRotate = false;
    
    // Animate camera position
    let startTime: number | null = null;
    const duration = 2000; // ms
    
    const animateCamera = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease function (cubic)
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Interpolate position
      const newX = currentPos.x + (targetPos.x - currentPos.x) * ease;
      const newY = currentPos.y + (targetPos.y - currentPos.y) * ease;
      const newZ = currentPos.z + (targetPos.z - currentPos.z) * ease;
      
      // Update camera
      if (cameraRef.current) {
        cameraRef.current.position.set(newX, newY, newZ);
        cameraRef.current.lookAt(0, 0, 0);
      }
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // Animation complete
        // Re-enable auto-rotation
        if (controlsRef.current) {
          controlsRef.current.autoRotate = true;
        }
        
        if (onComplete) {
          onComplete();
        }
      }
    };
    
    // Start animation
    requestAnimationFrame(animateCamera);
  }, []);
  
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current,
    globe: globeRef.current,
    isInitialized,
    flyToLocation
  };
}
