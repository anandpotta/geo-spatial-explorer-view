
import * as THREE from 'three';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';

/**
 * Load Earth textures and apply them to the given material
 */
export function loadEarthTextures(
  material: THREE.MeshPhongMaterial,
  onLoad: (earthLoaded: boolean, bumpMapLoaded: boolean) => void
): void {
  const options = createThreeViewerOptions();
  const textureLoader = new THREE.TextureLoader();
  
  // Track texture loading progress
  let earthTextureLoaded = false;
  let bumpMapLoaded = false;
  
  // Set texture loading manager to handle loading and errors better
  const loadingManager = new THREE.LoadingManager();
  loadingManager.onStart = (url) => {
    console.log('Started loading texture:', url);
  };
  
  loadingManager.onError = (url) => {
    console.error('Error loading texture:', url);
    // Call onLoad with current state to allow fallbacks
    if (!earthTextureLoaded || !bumpMapLoaded) {
      onLoad(earthTextureLoaded, bumpMapLoaded);
    }
  };
  
  // Use loading manager with texture loader
  const managedLoader = new THREE.TextureLoader(loadingManager);
  
  // Load a placeholder for immediate feedback while real textures load
  // Set an immediate basic color to give visual feedback
  material.color = new THREE.Color(0x1a5276);
  material.needsUpdate = true;
  
  // Load Earth texture with progressive enhancement
  const loadMainTexture = () => {
    managedLoader.load(
      options.textures.earthBaseUrl,
      (texture) => {
        console.log('Earth texture loaded');
        // THREE.js v0.133.0 uses encoding instead of colorSpace
        texture.encoding = THREE.sRGBEncoding; // For more accurate colors
        material.map = texture;
        material.needsUpdate = true;
        earthTextureLoaded = true;
        checkAllLoaded();
      },
      // Progress callback - not needed
      undefined,
      (error) => {
        console.error('Error loading Earth texture:', error);
        // Fallback to a local texture or directly bundled image
        managedLoader.load(
          '/placeholder.svg',
          (fallbackTexture) => {
            console.log('Using simple placeholder as Earth texture');
            fallbackTexture.encoding = THREE.sRGBEncoding;
            material.map = fallbackTexture;
            material.needsUpdate = true;
            earthTextureLoaded = true;
            checkAllLoaded();
          },
          undefined,
          () => {
            console.warn('All Earth textures failed, using blue color');
            material.color = new THREE.Color(0x1a5276);
            material.needsUpdate = true;
            earthTextureLoaded = true;
            checkAllLoaded();
          }
        );
      }
    );
  };
  
  // Load bump map with helpful fallback
  const loadBumpMap = () => {
    managedLoader.load(
      options.textures.bumpMapUrl,
      (texture) => {
        console.log('Bump texture loaded');
        material.bumpMap = texture;
        material.bumpScale = 0.08; // Subtle bump effect
        material.needsUpdate = true;
        bumpMapLoaded = true;
        checkAllLoaded();
      },
      undefined,
      (error) => {
        console.error('Error loading bump texture:', error);
        bumpMapLoaded = true; // Mark as loaded even though it failed
        checkAllLoaded();
      }
    );
  };
  
  // Check if all textures are loaded and trigger callback
  const checkAllLoaded = () => {
    if (earthTextureLoaded && bumpMapLoaded) {
      onLoad(earthTextureLoaded, bumpMapLoaded);
    }
  };
  
  // Start loading textures
  loadMainTexture();
  loadBumpMap();
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
