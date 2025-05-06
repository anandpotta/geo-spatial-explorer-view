
import * as THREE from 'three';
import { OUTER_SPACE_DISTANCE } from './types';
import { createGlobe, addStars } from './globe-creator';

/**
 * Initialize the Three.js scene
 */
export function initializeScene(
  width: number,
  height: number
): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  globe: THREE.Mesh;
} {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, EARTH_RADIUS * 20);
  camera.position.z = OUTER_SPACE_DISTANCE;
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
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
  
  return {
    scene,
    camera,
    renderer,
    globe
  };
}

/**
 * Handle window resize events
 */
export function setupResizeHandler(
  containerRef: React.RefObject<HTMLDivElement>,
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>,
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>
): () => void {
  const handleResize = () => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;
    
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}
