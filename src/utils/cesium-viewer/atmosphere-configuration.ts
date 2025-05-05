
import * as Cesium from 'cesium';

/**
 * Configures atmosphere for the Earth glow effect
 */
export function configureAtmosphere(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    // Configure skyAtmosphere for better visibility
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      
      // Use safe property checking to avoid errors with different Cesium versions
      const skyAtmosphere = viewer.scene.skyAtmosphere as any;
      if (skyAtmosphere) {
        // Only set these properties if they exist
        if ('hueShift' in skyAtmosphere) {
          skyAtmosphere.hueShift = 0.0;
          skyAtmosphere.saturationShift = 0.1;
          skyAtmosphere.brightnessShift = 3.0;
        }
        
        // Safely check for dynamicLighting method - using a number constant instead of enum
        if (typeof skyAtmosphere.setDynamicLighting === 'function') {
          // 0 corresponds to NONE in some Cesium versions
          skyAtmosphere.setDynamicLighting(0);
        }
      }
    }
    
    // Enhance globe lighting
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Set a more vibrant blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
      viewer.scene.globe.show = true;
      
      // Disable translucency which can cause visibility issues
      if ('translucency' in viewer.scene.globe) {
        viewer.scene.globe.translucency.enabled = false;
      }
    }
    
    // Force multiple renders
    for (let i = 0; i < 5; i++) {
      viewer.scene.requestRender();
    }
  } catch (e) {
    console.error('Error configuring atmosphere:', e);
  }
}

/**
 * Configures rendering for better globe visibility
 */
export function configureRendering(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    // Set vibrant blue color for the globe
    if (viewer.scene.globe) {
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
      viewer.scene.globe.depthTestAgainstTerrain = false;
      
      // Force the globe's surface to be correctly rendered
      const tileset = (viewer.scene.globe as any)._surface._tileProvider;
      if (tileset) {
        tileset._debug.wireframe = false;
        tileset._debug.boundingSphereTile = false;
        
        // Force tiles to be loaded and ready
        if (tileset._quadtree) {
          tileset._quadtree.preloadSiblings = true;
        }
      }
    }
    
    // Force multiple render cycles
    for (let i = 0; i < 5; i++) {
      viewer.scene.requestRender();
    }
    
    // Enable animation for globe rotation
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 2.0; // Faster rotation
    
    // Make canvas fully visible with high z-index
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
      viewer.canvas.style.zIndex = '1000'; // Higher z-index
    }
    
    // Force a resize for proper dimensions
    viewer.resize();
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}

/**
 * Forces immediate rendering of the globe with enhanced visibility
 * Fixed to prevent normalization errors during rendering
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.globe) {
    return;
  }
  
  try {
    // Make sure the globe is visible with even more vivid blue color
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = new Cesium.Color(0.0, 1.0, 1.0, 1.0); // Even brighter cyan color
    
    // Safely check before accessing internal properties
    const globe = viewer.scene.globe;
    
    // Make globe fully opaque
    if (typeof globe.translucency === 'object' && globe.translucency !== null) {
      globe.translucency.frontFaceAlpha = 1.0;
      globe.translucency.backFaceAlpha = 1.0;
    }
    
    // Disable fog and enhance brightness
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      
      // Access these properties safely using type assertion
      const skyAtmosphere = viewer.scene.skyAtmosphere as any;
      if (skyAtmosphere && 'brightnessShift' in skyAtmosphere) {
        skyAtmosphere.brightnessShift = 5.0; // Increase atmosphere brightness
      }
    }
    
    // Force immediate render multiple times
    for (let i = 0; i < 5; i++) {
      try {
        viewer.scene.requestRender();
      } catch (e) {
        console.warn('Render error caught and handled:', e);
      }
    }
    
    // Ensure canvas is fully visible with maximum z-index
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
      viewer.canvas.style.zIndex = '10000'; // Maximum z-index
      
      // Force size to be 100%
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
    }
    
    // Set black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Adjust camera if needed to see the globe - using safer approach to avoid normalization errors
    if (viewer.camera) {
      // Set a safe initial position
      viewer.camera.position = new Cesium.Cartesian3(0, 0, 20000000);
      
      // Use unit vectors directly to avoid normalization errors
      viewer.camera.direction = new Cesium.Cartesian3(0, 0, -1);
      viewer.camera.up = new Cesium.Cartesian3(0, 1, 0);
      viewer.camera.right = new Cesium.Cartesian3(1, 0, 0);
    }
    
    // Force another render
    try {
      viewer.scene.requestRender();
    } catch (e) {
      console.warn('Final render error caught and handled:', e);
    }
  } catch (e) {
    console.error('Error in forceGlobeVisibility:', e);
  }
}
