
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
  
  // Define fallback textures in case remote loading fails
  const earthTextureURL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
  const bumpTextureURL = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
  
  console.log('Loading Earth textures from:', earthTextureURL);
  
  // Load main texture
  textureLoader.load(
    earthTextureURL, 
    (texture) => {
      console.log('Earth texture loaded successfully');
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
