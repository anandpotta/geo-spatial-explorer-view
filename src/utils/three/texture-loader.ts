
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
  
  // Blue Marble - Natural Earth high-resolution texture
  const earthTextureURL = 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg';
  
  // High-detail bump map for terrain
  const bumpTextureURL = 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg';
  
  console.log('Loading high-resolution natural Earth textures...');
  
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
      
      // Remove opacity to ensure full vibrant colors
      earthMaterial.transparent = false;
      earthMaterial.opacity = 1.0;
      
      // Enhance natural colors
      earthMaterial.color = new THREE.Color(0xffffff); // Full white color multiplier for true texture colors
      
      earthMaterial.needsUpdate = true;
      earthTextureLoaded = true;
      
      // Add borders texture for country outlines
      const bordersTextureURL = 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/water_4k.png';
      textureLoader.load(
        bordersTextureURL,
        (bordersTexture) => {
          console.log('Borders texture loaded successfully');
          bordersTexture.anisotropy = 16;
          earthMaterial.displacementMap = bordersTexture;
          earthMaterial.displacementScale = 0.02; // Subtle displacement
          earthMaterial.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.error('Error loading borders texture:', error);
        }
      );
      
      // Notify progress
      onProgress(earthTextureLoaded, bumpTextureLoaded);
    },
    (progressEvent) => {
      // Optional progress callback
      console.log('Earth texture loading progress:', progressEvent);
    },
    (error) => {
      console.error('Error loading Earth texture:', error);
      // Fall back to NASA Blue Marble
      const fallbackTextureURL = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73580/world.topo.bathy.200401.3x5400x2700.jpg';
      console.log('Trying fallback texture:', fallbackTextureURL);
      
      textureLoader.load(
        fallbackTextureURL,
        (fallbackTexture) => {
          console.log('Fallback texture loaded successfully');
          fallbackTexture.anisotropy = 16;
          fallbackTexture.encoding = THREE.sRGBEncoding;
          fallbackTexture.needsUpdate = true;
          earthMaterial.map = fallbackTexture;
          
          // Ensure no transparency
          earthMaterial.transparent = false;
          earthMaterial.opacity = 1.0;
          
          earthMaterial.needsUpdate = true;
          earthTextureLoaded = true;
          onProgress(earthTextureLoaded, bumpTextureLoaded);
        },
        undefined,
        () => {
          // If both fail, try another Earth image
          const lastResortURL = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74443/world.200409.3x5400x2700.jpg';
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
      earthMaterial.bumpScale = 0.04; // Slightly increased bump effect for terrain visibility
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
      const fallbackBumpURL = 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg';
      textureLoader.load(
        fallbackBumpURL,
        (fallbackBump) => {
          fallbackBump.anisotropy = 16;
          fallbackBump.needsUpdate = true;
          earthMaterial.bumpMap = fallbackBump;
          earthMaterial.bumpScale = 0.04;
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
    size: 0.8, // Smaller stars
    transparent: true,
    opacity: 0.8 // Slightly transparent stars
  });
  
  // Create a large number of stars at random positions
  const starsVertices = [];
  for (let i = 0; i < 20000; i++) { // More stars
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
  
  console.log('Starfield background added to scene with 20000 stars');
}
