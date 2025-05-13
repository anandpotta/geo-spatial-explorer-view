
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
  
  // Try the night-time Earth texture first (showing city lights)
  const earthTextureURL = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg';
  
  // Use a high-detail bump map
  const bumpTextureURL = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/gebco_08_rev_elev_21600x10800.png';
  
  console.log('Loading high-resolution Earth night textures...');
  
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
      
      // Set emissive map for night lights to glow
      earthMaterial.emissiveMap = texture;
      earthMaterial.emissive = new THREE.Color(0xffffff);
      earthMaterial.emissiveIntensity = 0.5;
      
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
      const fallbackTextureURL = 'public/lovable-uploads/2dab3c16-1b4f-446f-ab48-2c49361c918b.png';
      console.log('Trying user-provided texture:', fallbackTextureURL);
      
      textureLoader.load(
        fallbackTextureURL,
        (fallbackTexture) => {
          console.log('User-provided texture loaded successfully');
          fallbackTexture.anisotropy = 16;
          fallbackTexture.encoding = THREE.sRGBEncoding;
          fallbackTexture.needsUpdate = true;
          earthMaterial.map = fallbackTexture;
          
          // Set emissive map for night lights to glow
          earthMaterial.emissiveMap = fallbackTexture;
          earthMaterial.emissive = new THREE.Color(0xffffff);
          earthMaterial.emissiveIntensity = 0.5;
          
          earthMaterial.needsUpdate = true;
          earthTextureLoaded = true;
          onProgress(earthTextureLoaded, bumpTextureLoaded);
        },
        undefined,
        () => {
          // If both fail, try another night-time Earth image
          const lastResortURL = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/55000/55167/earth_lights_lrg.jpg';
          textureLoader.load(
            lastResortURL,
            (lastTexture) => {
              console.log('Last resort texture loaded successfully');
              lastTexture.anisotropy = 16;
              lastTexture.encoding = THREE.sRGBEncoding;
              earthMaterial.map = lastTexture;
              
              // Set emissive map for night lights to glow
              earthMaterial.emissiveMap = lastTexture;
              earthMaterial.emissive = new THREE.Color(0xffffff);
              earthMaterial.emissiveIntensity = 0.5;
              
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
