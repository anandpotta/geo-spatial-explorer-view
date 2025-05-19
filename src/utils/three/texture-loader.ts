
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
  
  // Track texture loading progress
  let earthTextureLoaded = false;
  let bumpMapLoaded = false;
  
  // Set texture loading manager to handle loading and errors better
  const loadingManager = new THREE.LoadingManager();
  loadingManager.onStart = (url) => {
    console.log('Started loading texture:', url);
  };
  
  // Add timeout to the loading manager
  let loadingTimeout = setTimeout(() => {
    console.warn('Texture loading timed out, using fallbacks');
    if (!earthTextureLoaded || !bumpMapLoaded) {
      onLoad(earthTextureLoaded, bumpMapLoaded);
    }
  }, 3000); // 3 second timeout
  
  loadingManager.onError = (url) => {
    console.error('Error loading texture:', url);
    // Call onLoad with current state to allow fallbacks
    if (!earthTextureLoaded || !bumpMapLoaded) {
      onLoad(earthTextureLoaded, bumpMapLoaded);
    }
  };
  
  // Use loading manager with texture loader
  const managedLoader = new THREE.TextureLoader(loadingManager);
  
  // Use a simple blue color for immediate feedback
  material.color = new THREE.Color(0x1a5276);
  material.needsUpdate = true;
  
  // Load Earth texture with progressive enhancement
  const loadMainTexture = () => {
    // Try to load from a CDN first for better performance
    const textureSources = [
      options.textures.earthBaseUrl,
      '/placeholder.svg', // Fallback to local
    ];
    
    let sourceIndex = 0;
    
    const tryLoadTexture = () => {
      if (sourceIndex >= textureSources.length) {
        console.warn('All Earth textures failed, using blue color');
        material.color = new THREE.Color(0x1a5276);
        material.needsUpdate = true;
        earthTextureLoaded = true;
        checkAllLoaded();
        return;
      }
      
      const source = textureSources[sourceIndex];
      sourceIndex++;
      
      managedLoader.load(
        source,
        (texture) => {
          console.log('Earth texture loaded');
          // THREE.js v0.133.0 uses encoding instead of colorSpace
          texture.encoding = THREE.sRGBEncoding;
          material.map = texture;
          material.needsUpdate = true;
          earthTextureLoaded = true;
          checkAllLoaded();
        },
        // Progress callback - not needed
        undefined,
        () => {
          console.warn(`Failed to load texture from ${source}, trying next source`);
          tryLoadTexture();
        }
      );
    };
    
    // Start loading from first source
    tryLoadTexture();
  };
  
  // Skip bump map initially for faster loading - just mark it as loaded
  bumpMapLoaded = true;
  
  // Check if all textures are loaded and trigger callback
  const checkAllLoaded = () => {
    if (earthTextureLoaded && bumpMapLoaded) {
      clearTimeout(loadingTimeout);
      onLoad(earthTextureLoaded, bumpMapLoaded);
    }
  };
  
  // Start loading textures
  loadMainTexture();
}

/**
 * Create starfield background
 */
export function createStarfield(scene: THREE.Scene): THREE.Points {
  // Create a star field using points - with fewer stars for performance
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.05,
    transparent: true
  });
  
  // Create 1000 stars instead of 2000 for better performance
  const starsVertices = [];
  for (let i = 0; i < 1000; i++) {
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
