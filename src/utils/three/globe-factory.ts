
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
  
  // Create Earth sphere
  const earthGeometry = new THREE.SphereGeometry(
    EARTH_RADIUS,
    options.globe.segments,
    options.globe.segments
  );
  
  // Create basic material first so we have something visible right away
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x2233aa,  // Ocean blue as a fallback
    shininess: 5,
    specular: new THREE.Color('#000000'),
  });
  
  // Create Earth mesh
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  globeGroup.add(earthMesh);
  
  let earthTextureLoaded = false;
  let bumpTextureLoaded = false;
  
  return {
    globeGroup,
    earthMesh,
    setTexturesLoaded: (earthLoaded: boolean, bumpLoaded: boolean) => {
      earthTextureLoaded = earthLoaded;
      bumpTextureLoaded = bumpLoaded;
      
      return earthTextureLoaded && bumpTextureLoaded;
    }
  };
}

/**
 * Creates atmosphere sphere for Earth
 */
export function createAtmosphere(scene: THREE.Scene): THREE.Mesh {
  const options = createThreeViewerOptions();
  
  const atmosphereGeometry = new THREE.SphereGeometry(
    EARTH_RADIUS * 1.05,
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
  return atmosphere;
}

/**
 * Sets up the lighting for the scene
 */
export function setupLighting(scene: THREE.Scene): void {
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
}

/**
 * Configures the orbit controls for the globe
 */
export function configureControls(
  controls: OrbitControls | null, 
  camera: THREE.PerspectiveCamera | null
): void {
  if (!controls || !camera) return;
  
  const options = createThreeViewerOptions();
  
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = OUTER_SPACE_DISTANCE;
  controls.enablePan = false;
  controls.autoRotate = options.globe.enableRotation;
  controls.autoRotateSpeed = 0.5;
  
  // Position camera
  camera.position.z = OUTER_SPACE_DISTANCE;
  camera.lookAt(0, 0, 0);
}
