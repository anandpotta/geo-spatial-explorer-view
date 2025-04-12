
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
        viewer.scene.skyAtmosphere.brightnessShift = 2.5;
      }
    }
    
    // Ensure lighting for dramatic effect
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Force the globe to be visible with a bright pure blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
      viewer.scene.globe.show = true;
      
      // Force the scene to use translucency
      if ('translucency' in viewer.scene.globe) {
        viewer.scene.globe.translucency.enabled = false;
      }
    }
    
    // Force rendering update
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
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
    // Set a vibrant blue color for the globe
    if (viewer.scene.globe) {
      // Make sure globe is shown
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
      
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
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
    
    // Set up globe automatic rotation if not already rotating
    if (!viewer.clock.shouldAnimate) {
      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = 2.0; // Speed of rotation
    }
    
    // Update the canvas visibility
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
    }
    
    // Force resize for proper canvas dimensions
    viewer.resize();
    
    // Delay additional renders to ensure the globe appears after initial setup
    setTimeout(() => {
      if (!viewer.isDestroyed()) {
        for (let i = 0; i < 15; i++) {
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
    viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
    
    // Make sure fog is disabled which can interfere with visibility
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    // Force the scene to update and render
    viewer.scene.requestRender();
    
    // Make sure the canvas element is properly displayed
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
    }
    
    // Set a black background color for the scene
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Make sure the camera is set to see the globe
    if (viewer.camera) {
      // Only adjust camera if too far out
      const distance = Cesium.Cartesian3.magnitude(viewer.camera.position);
      if (distance > 30000000) {
        viewer.camera.lookAt(
          Cesium.Cartesian3.ZERO,
          new Cesium.Cartesian3(0, 0, 20000000)
        );
      }
    }
    
    // Force another render after adjusting camera
    viewer.scene.requestRender();
    
    // Find and force visibility on all Cesium-related elements
    const cesiumContainer = document.querySelector('[data-cesium-container="true"]');
    if (cesiumContainer) {
      (cesiumContainer as HTMLElement).style.visibility = 'visible';
      (cesiumContainer as HTMLElement).style.display = 'block';
      (cesiumContainer as HTMLElement).style.opacity = '1';
    }
    
    // Also ensure the cesium-widget and cesium-widget canvas are visible
    const cesiumWidget = document.querySelector('.cesium-widget');
    if (cesiumWidget) {
      (cesiumWidget as HTMLElement).style.visibility = 'visible';
      (cesiumWidget as HTMLElement).style.display = 'block';
      (cesiumWidget as HTMLElement).style.opacity = '1';
    }
    
    // Force a resize and additional renders
    viewer.resize();
    for (let i = 0; i < 5; i++) {
      viewer.scene.requestRender();
    }
  } catch (e) {
    console.error('Error in forceGlobeVisibility:', e);
  }
}
