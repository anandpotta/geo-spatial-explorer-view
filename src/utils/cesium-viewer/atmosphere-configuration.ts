
import * as Cesium from 'cesium';

/**
 * Configures atmosphere for the Earth glow effect
 */
export function configureAtmosphere(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    // Ensure skyAtmosphere is configured properly
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      
      // Set atmospheric properties if available
      if ('hueShift' in viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.1;
        viewer.scene.skyAtmosphere.brightnessShift = 2.0; // Increase brightness for better visibility
      }
    }
    
    // Ensure lighting for dramatic effect
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Force the globe to be visible with a bright pure blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
      viewer.scene.globe.show = true;
      
      // Force the scene to use translucency
      if ('translucency' in viewer.scene.globe) {
        viewer.scene.globe.translucency.enabled = false;
      }
      
      // Make sure the globe is not transparent
      if ('material' in viewer.scene.globe) {
        try {
          (viewer.scene.globe as any).material = undefined;
        } catch (e) {
          console.log('Could not reset globe material');
        }
      }
    }
    
    // Force rendering update
    viewer.scene.requestRender();
  } catch (e) {
    console.error('Error configuring atmosphere:', e);
  }
}

/**
 * Configures post-processing and rendering
 */
export function configureRendering(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    // Set a vibrant blue color for the globe if available
    if (viewer.scene.globe) {
      // Make sure globe is shown
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
      
      // Force the globe to be visible by applying additional settings
      viewer.scene.globe.depthTestAgainstTerrain = false;
      
      // Make sure the globe's surface is rendered
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
    
    // Force multiple render cycles to ensure the globe appears
    for (let i = 0; i < 15; i++) {
      viewer.scene.requestRender();
    }
    
    // Set up globe automatic rotation if not already rotating
    if (!viewer.clock.shouldAnimate) {
      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = 2.0; // Speed of rotation
    }
    
    // Update the canvas visiblity
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
    }
    
    // Force resize for proper canvas dimensions
    viewer.resize();
    
    // Delay additional renders to ensure the globe appears after initial setup
    setTimeout(() => {
      if (!viewer.isDestroyed()) {
        for (let i = 0; i < 10; i++) {
          viewer.scene.requestRender();
        }
      }
    }, 500);
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}

/**
 * Forces immediate rendering of the globe with additional visibility checks
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.globe) {
    return;
  }
  
  try {
    // Make absolutely sure the globe is visible
    viewer.scene.globe.show = true;
    
    // Force the scene to update and render
    viewer.scene.requestRender();
    
    // Make sure the canvas element is properly displayed
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
    }
    
    // Find the cesiumWidgetContainer and make sure it's visible
    const cesiumContainer = document.querySelector('[data-cesium-container="true"]');
    if (cesiumContainer) {
      (cesiumContainer as HTMLElement).style.visibility = 'visible';
      (cesiumContainer as HTMLElement).style.display = 'block';
    }
    
    // Log the canvas state for debugging
    if (viewer.canvas) {
      console.log('Canvas dimensions:', viewer.canvas.width, 'x', viewer.canvas.height);
      console.log('Canvas visibility:', viewer.canvas.style.visibility);
      console.log('Canvas display:', viewer.canvas.style.display);
    }
    
    // Force another resize after a short delay
    setTimeout(() => {
      if (!viewer.isDestroyed()) {
        viewer.resize();
        viewer.scene.requestRender();
      }
    }, 100);
  } catch (e) {
    console.error('Error in forceGlobeVisibility:', e);
  }
}
