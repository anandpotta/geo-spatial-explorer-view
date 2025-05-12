
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
    96, // Higher segment count for smoother sphere
    96
  );
  
  // Create basic material first so we have something visible right away
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x2233aa,  // Ocean blue as a fallback
    shininess: 15,    // Increase shininess for better look
    specular: new THREE.Color('#333333'),
  });
  
  // Create Earth mesh
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  globeGroup.add(earthMesh);
  
  // Make this group immediately visible in the scene
  scene.add(globeGroup);
  
  console.log('Earth globe created with basic material and added to scene');
  
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
    EARTH_RADIUS * 1.05,
    96, // Higher segment count for smoother sphere
    96
  );
  
  // Use a more realistic atmosphere material
  const atmosphereMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x6699ff), // Light blue atmosphere
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });
  
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere); // Add directly to scene
  console.log('Atmosphere added to scene');
  
  return atmosphere;
}

/**
 * Sets up the lighting for the scene
 */
export function setupLighting(scene: THREE.Scene): void {
  const options = createThreeViewerOptions();
  
  // Add ambient lighting
  const ambientLight = new THREE.AmbientLight(
    0x404040,
    0.8
  );
  scene.add(ambientLight);
  console.log('Ambient light added to scene');
  
  // Main directional light (sun)
  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    1.2
  );
  directionalLight.position.set(1, 0.5, 1);
  scene.add(directionalLight);
  console.log('Directional light added to scene');
  
  // Add a second light from the opposite direction for better illumination
  const backLight = new THREE.DirectionalLight(0x555555, 0.6); // Increased intensity
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
  const options = createThreeViewerOptions();
  
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = OUTER_SPACE_DISTANCE * 1.5; // Allow zooming out further to see stars
  controls.enablePan = false;
  controls.autoRotate = true; // Enable auto-rotation
  controls.autoRotateSpeed = 0.5;
  
  // Position camera
  camera.position.z = EARTH_RADIUS * 3; // Start closer to see the globe
  camera.lookAt(0, 0, 0);
  console.log('Camera positioned at:', camera.position);
}
