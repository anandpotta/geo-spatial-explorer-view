
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// Earth radius in km
const EARTH_RADIUS = 6371;
// Distance to show the full Earth
const OUTER_SPACE_DISTANCE = EARTH_RADIUS * 4;
// Closest distance to Earth's surface when zoomed in
const MIN_DISTANCE = EARTH_RADIUS * 0.2;

interface ThreeGlobeResult {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  globe: THREE.Mesh | null;
  flyToLocation: (longitude: number, latitude: number, onComplete?: () => void) => void;
  isInitialized: boolean;
}

export const useThreeGlobe = (
  containerRef: React.RefObject<HTMLDivElement>,
  onGlobeReady?: () => void
): ThreeGlobeResult => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // State for tracking flying animations
  const flyingStateRef = useRef({
    isFlying: false,
    startPosition: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    startTime: 0,
    duration: 0,
    onComplete: null as (() => void) | null,
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    try {
      // Check for WebGL support
      if (!isWebGLAvailable()) {
        console.error('WebGL is not supported in this browser');
        return;
      }
      
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, EARTH_RADIUS * 20);
      camera.position.z = OUTER_SPACE_DISTANCE;
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
      
      // Create ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 1);
      scene.add(ambientLight);
      
      // Create directional light (sunlight)
      const sunLight = new THREE.DirectionalLight(0xffffff, 1);
      sunLight.position.set(1, 0, 1).normalize();
      scene.add(sunLight);
      
      // Create Earth with improved texture
      const globe = createGlobe();
      scene.add(globe);
      
      // Add stars
      addStars(scene);
      
      // Store refs
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      globeRef.current = globe;
      isInitializedRef.current = true;
      setIsInitialized(true);
      
      // Set up animation loop
      const animate = () => {
        if (globeRef.current && !flyingStateRef.current.isFlying) {
          // Auto-rotate when not flying
          globeRef.current.rotation.y += 0.001;
        }
        
        // Handle flying animation if active
        if (flyingStateRef.current.isFlying) {
          updateFlyingAnimation();
        }
        
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      
      // Add event listeners for resize
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Add basic controls
      setupControls(container);
      
      // Signal that the globe is ready
      if (onGlobeReady) {
        setTimeout(onGlobeReady, 500);
      }
      
      // Cleanup function
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        window.removeEventListener('resize', handleResize);
        
        if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
          try {
            containerRef.current.removeChild(rendererRef.current.domElement);
          } catch (e) {
            console.warn('Could not remove renderer DOM element', e);
          }
        }
        
        // Dispose of Three.js resources
        if (globeRef.current) {
          disposeObject(globeRef.current);
        }
        
        if (sceneRef.current) {
          disposeScene(sceneRef.current);
        }
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      };
    } catch (error) {
      console.error('Error initializing Three.js globe:', error);
    }
  }, [containerRef, onGlobeReady]);
  
  // Function to create the Earth globe with better textures
  const createGlobe = (): THREE.Mesh => {
    // Create a sphere geometry for the globe
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    
    // Create a shader material for better appearance
    const material = new THREE.MeshPhongMaterial({
      color: 0x3399ff,
      specular: 0x555555,
      shininess: 30,
      transparent: false,
      opacity: 1.0
    });
    
    // Create the mesh using the geometry and material
    const globe = new THREE.Mesh(geometry, material);
    
    // Add grid lines for visual reference
    addLatLongGrid(globe);
    
    // Add atmosphere glow effect
    addAtmosphereGlow(globe);
    
    return globe;
  };

  // Add atmosphere glow effect
  const addAtmosphereGlow = (globe: THREE.Mesh) => {
    // Add a slightly larger sphere with a shader material for the glow effect
    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globe.add(atmosphere);
  };
  
  // Add a simple latitude/longitude grid to the globe
  const addLatLongGrid = (globe: THREE.Mesh) => {
    const lineColor = 0x55AAFF;
    const material = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.4 });
    
    // Add longitude lines
    for (let i = 0; i < 24; i++) {
      const phi = (i / 24) * Math.PI * 2;
      const points = [];
      for (let j = 0; j <= 180; j++) {
        const theta = (j / 180) * Math.PI;
        const x = EARTH_RADIUS * Math.sin(theta) * Math.cos(phi);
        const y = EARTH_RADIUS * Math.cos(theta);
        const z = EARTH_RADIUS * Math.sin(theta) * Math.sin(phi);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      globe.add(line);
    }
    
    // Add latitude lines
    for (let i = 0; i < 12; i++) {
      const theta = (i / 12) * Math.PI;
      const points = [];
      for (let j = 0; j <= 360; j++) {
        const phi = (j / 360) * Math.PI * 2;
        const x = EARTH_RADIUS * Math.sin(theta) * Math.cos(phi);
        const y = EARTH_RADIUS * Math.cos(theta);
        const z = EARTH_RADIUS * Math.sin(theta) * Math.sin(phi);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      globe.add(line);
    }
  };
  
  // Add stars to the background with improved visuals
  const addStars = (scene: THREE.Scene) => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 15000; i++) {
      // Create a sphere of stars around the scene
      const radius = EARTH_RADIUS * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
  };
  
  // Set up basic controls
  const setupControls = (container: HTMLDivElement) => {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    container.addEventListener('mousedown', (event) => {
      isDragging = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
      event.preventDefault();
    });
    
    container.addEventListener('mousemove', (event) => {
      if (!isDragging || !globeRef.current || flyingStateRef.current.isFlying) return;
      
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };
      
      // Rotate the globe based on mouse movement
      globeRef.current.rotation.y += deltaMove.x * 0.005;
      globeRef.current.rotation.x += deltaMove.y * 0.005;
      
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    });
    
    container.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    container.addEventListener('mouseleave', () => {
      isDragging = false;
    });
    
    // Touch events for mobile support
    container.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        isDragging = true;
        previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
        event.preventDefault();
      }
    });
    
    container.addEventListener('touchmove', (event) => {
      if (isDragging && event.touches.length === 1 && globeRef.current && !flyingStateRef.current.isFlying) {
        const deltaMove = {
          x: event.touches[0].clientX - previousMousePosition.x,
          y: event.touches[0].clientY - previousMousePosition.y
        };
        
        globeRef.current.rotation.y += deltaMove.x * 0.005;
        globeRef.current.rotation.x += deltaMove.y * 0.005;
        
        previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
        
        event.preventDefault();
      }
    });
    
    container.addEventListener('touchend', () => {
      isDragging = false;
    });
    
    // Add zoom controls
    container.addEventListener('wheel', (event) => {
      if (!cameraRef.current || flyingStateRef.current.isFlying) return;
      
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      
      // Calculate new distance keeping it within bounds
      const currentDistance = cameraRef.current.position.length();
      const newDistance = Math.max(
        MIN_DISTANCE,
        Math.min(OUTER_SPACE_DISTANCE, currentDistance * (1 + direction * zoomSpeed))
      );
      
      // Update the camera position while keeping the same direction
      cameraRef.current.position.normalize();
      cameraRef.current.position.multiplyScalar(newDistance);
      
      event.preventDefault();
    });
  };
  
  // Function to update the flying animation
  const updateFlyingAnimation = () => {
    const { 
      startPosition, 
      targetPosition, 
      startTime, 
      duration, 
      onComplete 
    } = flyingStateRef.current;
    
    const camera = cameraRef.current;
    if (!camera) return;
    
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Use an easing function for smoother animation
    const easeProgress = easeInOutCubic(progress);
    
    // Interpolate camera position
    camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
    
    // If animation is complete
    if (progress >= 1.0) {
      flyingStateRef.current.isFlying = false;
      if (onComplete) onComplete();
    }
  };
  
  // Easing function for smoother animations
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // Function to fly to a specific latitude and longitude
  const flyToLocation = useCallback((longitude: number, latitude: number, onComplete?: () => void) => {
    if (!cameraRef.current || !globeRef.current) return;
    
    // Convert the latitude and longitude to a 3D position
    const phi = (90 - latitude) * Math.PI / 180;
    const theta = (longitude + 180) * Math.PI / 180;
    
    // Calculate position on globe
    const x = -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
    const y = EARTH_RADIUS * Math.cos(phi);
    const z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
    
    const targetPosition = new THREE.Vector3(x, y, z);
    
    // Adjust the globe's rotation to make the target point face the camera
    globeRef.current.rotation.y = theta;
    globeRef.current.rotation.x = phi - Math.PI/2;
    
    // Set up the camera position for flying animation
    const startPosition = cameraRef.current.position.clone();
    
    // Target position should be just outside the surface of the globe
    const direction = targetPosition.clone().normalize();
    const targetCameraPosition = direction.multiplyScalar(EARTH_RADIUS * 1.5);
    
    // Store the animation state
    flyingStateRef.current = {
      isFlying: true,
      startPosition,
      targetPosition: targetCameraPosition,
      startTime: Date.now(),
      duration: 2000, // 2 seconds
      onComplete,
    };
    
    console.log('Starting flight to:', { longitude, latitude });
  }, []);
  
  // Helper function to check WebGL availability
  const isWebGLAvailable = (): boolean => {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  };
  
  // Helper to dispose Three.js objects
  const disposeObject = (obj: THREE.Object3D): void => {
    if (!obj) return;
    
    // Handle children first
    while (obj.children.length > 0) {
      disposeObject(obj.children[0]);
      obj.remove(obj.children[0]);
    }
    
    // Then handle the object itself
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) obj.geometry.dispose();
      
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => {
            disposeMaterial(material);
          });
        } else {
          disposeMaterial(obj.material);
        }
      }
    }
  };
  
  // Helper to dispose material and its textures
  const disposeMaterial = (material: THREE.Material): void => {
    if (!material) return;
    
    // Dispose textures
    Object.keys(material).forEach(prop => {
      if (!material[prop]) return;
      if (material[prop] instanceof THREE.Texture) {
        material[prop].dispose();
      }
    });
    
    material.dispose();
  };
  
  // Helper to dispose an entire scene
  const disposeScene = (scene: THREE.Scene): void => {
    while (scene.children.length > 0) {
      disposeObject(scene.children[0]);
      scene.remove(scene.children[0]);
    }
  };
  
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    globe: globeRef.current,
    flyToLocation,
    isInitialized,
  };
};
