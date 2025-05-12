
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
  
  // Load main texture
  textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', 
    (texture) => {
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
      earthTextureLoaded = true;
      
      // Notify progress
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    },
    undefined,  // onProgress callback not needed
    (error) => {
      console.error('Error loading Earth texture:', error);
      // Still mark as loaded to prevent blocking
      earthTextureLoaded = true;
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    }
  );
  
  // Load bump map
  textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-topology.png', 
    (bumpTexture) => {
      earthMaterial.bumpMap = bumpTexture;
      earthMaterial.bumpScale = 0.05;
      earthMaterial.needsUpdate = true;
      bumpTextureLoaded = true;
      
      // Notify progress
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    },
    undefined,  // onProgress callback not needed
    (error) => {
      console.error('Error loading bump texture:', error);
      // Still mark as loaded to prevent blocking
      bumpTextureLoaded = true;
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    }
  );
}
