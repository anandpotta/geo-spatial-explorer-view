
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';

// Earth radius in km (scaled)
export const EARTH_RADIUS = 5;
// Distance to show the full Earth
export const OUTER_SPACE_DISTANCE = EARTH_RADIUS * 4;
// Closest distance to Earth's surface
export const MIN_DISTANCE = EARTH_RADIUS * 1.2;

/**
 * Creates Earth globe and returns the globe group
 */
export function createEarthGlobe(scene: THREE.Scene): {
  globeGroup: THREE.Group;
  earthMesh: THREE.Mesh;
  setTexturesLoaded: (earthLoaded: boolean, bumpLoaded: boolean) => boolean;
} {
  const options = createThreeViewerOptions();
  const globeGroup = new THREE.Group();
  
  // Create Earth sphere with higher segment count for smoother appearance
  const earthGeometry = new THREE.SphereGeometry(
    EARTH_RADIUS,
    128, // Higher segment count for smoother sphere
    128
  );
  
  // Create more natural material with vibrant base colors
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,  // Pure white base to let texture colors show naturally
    shininess: 5,     // Lower shininess for more natural matte appearance
    specular: new THREE.Color(0x111111), // Minimal specular highlights
    reflectivity: 0   // No reflectivity for natural appearance
  });
  
  // Create Earth mesh
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  globeGroup.add(earthMesh);
  
  // Add a subtle highlight to indicate the current side facing the light
  const highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.15,
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending
  });
  
  const highlightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.001, 64, 64),
    highlightMaterial
  );
  
  // Only cover part of the sphere with the highlight
  highlightSphere.scale.setScalar(1.02);
  highlightSphere.rotation.y = Math.PI * 0.5;
  
  // Add the highlight to the globe group
  globeGroup.add(highlightSphere);
  
  // Make this group immediately visible in the scene
  scene.add(globeGroup);
  
  console.log('Earth globe created with natural colors material and added to scene');
  
  let earthTextureLoaded = false;
  let bumpTextureLoaded = false;
  
  return {
    globeGroup,
    earthMesh,
    setTexturesLoaded: (earthLoaded: boolean, bumpLoaded: boolean) => {
      earthTextureLoaded = earthLoaded;
      bumpTextureLoaded = bumpLoaded;
      
      const allLoaded = earthTextureLoaded && bumpTextureLoaded;
      console.log(`Textures loaded - Earth: ${earthLoaded}, Bump: ${bumpLoaded}, All: ${allLoaded}`);
      return allLoaded;
    }
  };
}

/**
 * Creates atmosphere sphere for Earth
 */
export function createAtmosphere(scene: THREE.Scene): THREE.Mesh {
  const options = createThreeViewerOptions();
  
  // Create slightly larger geometry for atmosphere
  const atmosphereGeometry = new THREE.SphereGeometry(
    EARTH_RADIUS * 1.025, // Thinner atmosphere for more realistic look
    128, // Higher segment count for smoother sphere
    128
  );
  
  // Use a subtle atmosphere material to not overpower natural Earth colors
  const atmosphereMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x88ccff), // Light blue atmosphere
    transparent: true,
    opacity: 0.1, // Very subtle opacity
    side: THREE.BackSide,
  });
  
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere); // Add directly to scene
  console.log('Subtle atmosphere added to scene');
  
  return atmosphere;
}

/**
 * Sets up the lighting for the scene
 */
export function setupLighting(scene: THREE.Scene): void {
  // Clear any existing lights
  scene.children.forEach(child => {
    if (child instanceof THREE.Light) {
      scene.remove(child);
    }
  });
  
  // Add ambient lighting - bright enough to see natural colors
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.6  // Moderate ambient light to ensure we can see the dark side a bit
  );
  scene.add(ambientLight);
  console.log('Ambient light added to scene');
  
  // Main directional light (sun) - bright natural sunlight
  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    1.2  // Slightly higher intensity for better visibility
  );
  directionalLight.position.set(1, 0.5, 1);
  scene.add(directionalLight);
  console.log('Directional light added to scene');
  
  // Add a second light from the opposite direction for better illumination
  const backLight = new THREE.DirectionalLight(0xaaddff, 0.2); // Soft blue-tinted back light
  backLight.position.set(-1, -0.5, -1);
  scene.add(backLight);
  console.log('Back light added to scene');
}

/**
 * Configures the orbit controls for the globe
 */
export function configureControls(
  controls: OrbitControls | null, 
  camera: THREE.PerspectiveCamera | null
): void {
  if (!controls || !camera) {
    console.warn('Cannot configure controls or camera - they are null');
    return;
  }
  
  console.log('Configuring orbit controls for camera');
  
  // Enhanced control settings for smoother experience
  controls.enableDamping = true;
  controls.dampingFactor = 0.1; // Increased for smoother stops
  controls.rotateSpeed = 0.4;   // Slower rotation for more control
  controls.zoomSpeed = 0.8;     // Slower zoom for better control
  
  // Distance limits
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = OUTER_SPACE_DISTANCE * 1.5;
  
  // Disable panning for simpler navigation
  controls.enablePan = false;
  
  // Enable auto-rotation for dynamic appearance
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3; // Moderate rotation speed
  
  // Set reasonable rotation limits to prevent upside-down view
  controls.minPolarAngle = Math.PI * 0.1;  // Limit top view
  controls.maxPolarAngle = Math.PI * 0.9;  // Limit bottom view
  
  // Position camera to see the day side of Earth
  camera.position.set(0, 10, 10);
  camera.lookAt(0, 0, 0);
  console.log('Camera positioned for optimal Earth view');
}
