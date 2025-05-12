
import * as THREE from 'three';

/**
 * Loads Earth textures and applies them to the material
 */
export function loadEarthTextures(
  earthMaterial: THREE.MeshPhongMaterial,
  onProgress: (textureLoaded: boolean, bumpLoaded: boolean) => void
): void {
  // Load Earth texture with absolute URLs to ensure they load
  const textureLoader = new THREE.TextureLoader();
  let earthTextureLoaded = false;
  let bumpTextureLoaded = false;
  
  // Define HD textures for better visual quality
  const earthTextureURL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
  const bumpTextureURL = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
  
  console.log('Loading Earth textures from:', earthTextureURL);
  
  // Load main texture
  textureLoader.load(
    earthTextureURL, 
    (texture) => {
      console.log('Earth texture loaded successfully');
      // Apply texture settings for better quality
      texture.anisotropy = 16;
      texture.encoding = THREE.sRGBEncoding;
      texture.needsUpdate = true;
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
      earthTextureLoaded = true;
      
      // Notify progress
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    },
    (progressEvent) => {
      // Optional progress callback
      console.log('Earth texture loading progress:', progressEvent);
    },
    (error) => {
      console.error('Error loading Earth texture:', error);
      // Still mark as loaded to prevent blocking
      earthTextureLoaded = true;
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    }
  );
  
  // Load bump map
  textureLoader.load(
    bumpTextureURL, 
    (bumpTexture) => {
      console.log('Bump texture loaded successfully');
      bumpTexture.anisotropy = 16;
      bumpTexture.needsUpdate = true;
      earthMaterial.bumpMap = bumpTexture;
      earthMaterial.bumpScale = 0.05;
      earthMaterial.needsUpdate = true;
      bumpTextureLoaded = true;
      
      // Notify progress
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    },
    (progressEvent) => {
      // Optional progress callback
      console.log('Bump texture loading progress:', progressEvent);
    },
    (error) => {
      console.error('Error loading bump texture:', error);
      // Still mark as loaded to prevent blocking
      bumpTextureLoaded = true;
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    }
  );
}

/**
 * Creates a starfield background for the scene
 */
export function createStarfield(scene: THREE.Scene): void {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    transparent: true,
    opacity: 1.0 // Full opacity for stars
  });
  
  // Create a large number of stars at random positions
  const starsVertices = [];
  for (let i = 0; i < 15000; i++) { // More stars
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
  
  console.log('Starfield background added to scene with 15000 stars');
}
