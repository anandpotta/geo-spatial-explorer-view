
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
  
  // Use NASA's Blue Marble Next Generation with topography and bathymetry
  const earthTextureURL = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74117/world.200412.3x5400x2700.jpg';
  
  // Use a high-detail bump map
  const bumpTextureURL = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/gebco_08_rev_elev_21600x10800.png';
  
  console.log('Loading high-resolution Earth textures...');
  
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
      // Use the uploaded image as fallback
      const fallbackTextureURL = 'public/lovable-uploads/40c69632-a13b-4264-886a-7ea756c3c93d.png';
      console.log('Trying user-provided texture:', fallbackTextureURL);
      
      textureLoader.load(
        fallbackTextureURL,
        (fallbackTexture) => {
          console.log('User-provided texture loaded successfully');
          fallbackTexture.anisotropy = 16;
          fallbackTexture.encoding = THREE.sRGBEncoding;
          fallbackTexture.needsUpdate = true;
          earthMaterial.map = fallbackTexture;
          earthMaterial.needsUpdate = true;
          earthTextureLoaded = true;
          onProgress(earthTextureLoaded, bumpTextureLoaded);
        },
        undefined,
        () => {
          // If both fail, try another reliable source
          const lastResortURL = 'https://unpkg.com/three-globe@2.27.1/example/img/earth-blue-marble.jpg';
          textureLoader.load(
            lastResortURL,
            (lastTexture) => {
              console.log('Last resort texture loaded successfully');
              lastTexture.anisotropy = 16;
              lastTexture.encoding = THREE.sRGBEncoding;
              earthMaterial.map = lastTexture;
              earthMaterial.needsUpdate = true;
              earthTextureLoaded = true;
              onProgress(earthTextureLoaded, bumpTextureLoaded);
            },
            undefined,
            () => {
              console.error('All textures failed to load');
              earthTextureLoaded = true;
              onProgress(earthTextureLoaded, bumpTextureLoaded);
            }
          );
        }
      );
    }
  );
  
  // Load bump map for terrain
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
      // Try fallback bump texture
      const fallbackBumpURL = 'https://unpkg.com/three-globe@2.27.1/example/img/earth-topology.png';
      textureLoader.load(
        fallbackBumpURL,
        (fallbackBump) => {
          fallbackBump.anisotropy = 16;
          fallbackBump.needsUpdate = true;
          earthMaterial.bumpMap = fallbackBump;
          earthMaterial.bumpScale = 0.05;
          earthMaterial.needsUpdate = true;
          bumpTextureLoaded = true;
          onProgress(earthTextureLoaded, bumpTextureLoaded);
        },
        undefined,
        () => {
          // Still mark as loaded to prevent blocking
          bumpTextureLoaded = true;
          onProgress(earthTextureLoaded, bumpTextureLoaded);
        }
      );
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
