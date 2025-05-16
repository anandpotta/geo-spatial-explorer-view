import * as THREE from 'three';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';

/**
 * Load Earth textures and apply them to the given material
 * Modified to improve loading performance
 */
export function loadEarthTextures(
  material: THREE.MeshPhongMaterial,
  onLoad: (earthLoaded: boolean, bumpLoaded: boolean) => void
): void {
  const options = createThreeViewerOptions();
  const textureLoader = new THREE.TextureLoader();
  
  // Track texture loading progress
  let earthTextureLoaded = false;
  let bumpMapLoaded = false;
  
  // Set timeout to ensure callback happens even if textures are slow
  setTimeout(() => {
    if (!earthTextureLoaded || !bumpMapLoaded) {
      console.log('Forcing texture load completion after timeout');
      onLoad(true, true); // Force completion after timeout
    }
  }, 3000);
  
  // Load Earth texture
  // We'll use a placeholder texture initially for faster loading
  const placeholderTexture = new THREE.TextureLoader().load('/placeholder.svg', undefined, undefined, 
    (error) => {
      console.warn('Placeholder texture failed to load, using color instead');
      // If even placeholder fails, just use a color
      material.color = new THREE.Color(0x1a2b3c);
      material.needsUpdate = true;
    }
  );
  material.map = placeholderTexture;
  
  // Load the Earth texture with high priority
  textureLoader.load(
    options.textures.earthBaseUrl,
    (texture) => {
      console.log('Earth texture loaded');
      // THREE.js v0.133.0 uses encoding instead of colorSpace
      texture.encoding = THREE.sRGBEncoding; // For more accurate colors
      material.map = texture;
      material.needsUpdate = true;
      earthTextureLoaded = true;
      onLoad(earthTextureLoaded, bumpMapLoaded);
    },
    undefined, // Progress callback not needed
    (error) => {
      console.error('Error loading Earth texture:', error);
      // Fallback to a local texture or directly bundled image
      textureLoader.load(
        '/placeholder.svg',
        (fallbackTexture) => {
          console.log('Using simple placeholder as Earth texture');
          fallbackTexture.encoding = THREE.sRGBEncoding;
          material.map = fallbackTexture;
          material.needsUpdate = true;
          earthTextureLoaded = true;
          onLoad(earthTextureLoaded, bumpMapLoaded);
        },
        undefined,
        () => {
          console.warn('All Earth textures failed, using blue color');
          material.color = new THREE.Color(0x1a5276);
          material.needsUpdate = true;
          earthTextureLoaded = true;
          onLoad(earthTextureLoaded, bumpMapLoaded);
        }
      );
    }
  );
  
  // Load bump map with lower priority (after basic globe is shown)
  setTimeout(() => {
    textureLoader.load(
      options.textures.bumpMapUrl,
      (texture) => {
        console.log('Bump texture loaded');
        material.bumpMap = texture;
        material.bumpScale = 0.08; // Subtle bump effect
        material.needsUpdate = true;
        bumpMapLoaded = true;
        onLoad(earthTextureLoaded, bumpMapLoaded);
      },
      undefined,
      (error) => {
        console.error('Error loading bump texture:', error);
        bumpMapLoaded = true; // Mark as loaded even though it failed
        onLoad(earthTextureLoaded, bumpMapLoaded);
      }
    );
  }, 1000); // Delay bump map loading for faster initial display
}

/**
 * Create starfield background
 */
export function createStarfield(scene: THREE.Scene): THREE.Points {
  // Create a star field using points
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.05,
    transparent: true
  });
  
  // Create 2000 stars at random positions
  const starsVertices = [];
  for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  starField.userData.type = 'starfield';
  scene.add(starField);
  
  return starField;
}
