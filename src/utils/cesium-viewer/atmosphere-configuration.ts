
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
      
      // Set atmospheric properties for better visibility
      if ('hueShift' in viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.1;
        viewer.scene.skyAtmosphere.brightnessShift = 3.0; // Increased brightness
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
    for (let i = 0; i < 30; i++) {
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
    for (let i = 0; i < 30; i++) {
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
    
    // Schedule additional renders after setup
    setTimeout(() => {
      if (!viewer.isDestroyed()) {
        for (let i = 0; i < 20; i++) {
          viewer.scene.requestRender();
        }
        
        // One more resize after renders
        viewer.resize();
      }
    }, 500);
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}

/**
 * Forces immediate rendering of the globe with enhanced visibility
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.globe) {
    return;
  }
  
  try {
    // Make sure the globe is visible with even more vibrant blue color
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
    
    // Disable fog for clearer view
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    // Force immediate render
    viewer.scene.requestRender();
    
    // Ensure canvas is fully visible with high z-index
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
      viewer.canvas.style.zIndex = '9999'; // Even higher z-index
      
      // Force size to be 100%
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
    }
    
    // Set black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Adjust camera if needed to see the globe
    if (viewer.camera) {
      // Only adjust if too far out
      const distance = Cesium.Cartesian3.magnitude(viewer.camera.position);
      if (distance > 25000000) {
        viewer.camera.lookAt(
          Cesium.Cartesian3.ZERO,
          new Cesium.Cartesian3(0, 0, 15000000) // Closer look
        );
      }
    }
    
    // Force another render
    viewer.scene.requestRender();
    
    // Force visibility on all Cesium-related elements
    const cesiumContainer = document.querySelector('[data-cesium-container="true"]');
    if (cesiumContainer) {
      (cesiumContainer as HTMLElement).style.visibility = 'visible';
      (cesiumContainer as HTMLElement).style.display = 'block';
      (cesiumContainer as HTMLElement).style.opacity = '1';
      (cesiumContainer as HTMLElement).style.zIndex = '9999';
    }
    
    // Ensure the cesium-widget and canvas are visible
    const cesiumWidget = document.querySelector('.cesium-widget');
    if (cesiumWidget) {
      (cesiumWidget as HTMLElement).style.visibility = 'visible';
      (cesiumWidget as HTMLElement).style.display = 'block';
      (cesiumWidget as HTMLElement).style.opacity = '1';
      (cesiumWidget as HTMLElement).style.zIndex = '9999';
      
      // Also adjust any canvas elements inside
      const canvases = (cesiumWidget as HTMLElement).querySelectorAll('canvas');
      canvases.forEach(canvas => {
        canvas.style.visibility = 'visible';
        canvas.style.display = 'block';
        canvas.style.opacity = '1';
      });
    }
    
    // Force resize and multiple renders
    viewer.resize();
    for (let i = 0; i < 15; i++) {
      viewer.scene.requestRender();
    }
  } catch (e) {
    console.error('Error in forceGlobeVisibility:', e);
  }
}
