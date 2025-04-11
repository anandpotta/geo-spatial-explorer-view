
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
        viewer.scene.skyAtmosphere.brightnessShift = 1.0; // Increased brightness
      }
    }
    
    // Ensure lighting for dramatic effect
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Force the globe to be visible with a bright pure blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.7, 1.0, 1.0); // Brighter blue
      viewer.scene.globe.show = true;
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
    // Only request renders if the scene is valid and not destroyed
    if (viewer.scene && !viewer.isDestroyed()) {
      // Set a vibrant blue color for the globe if available
      if (viewer.scene.globe) {
        // Make sure globe is shown
        viewer.scene.globe.show = true;
        viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.7, 1.0, 1.0); // Brighter blue
      }
      
      // Force multiple render cycles to ensure the globe appears
      for (let i = 0; i < 5; i++) {
        viewer.scene.requestRender();
      }
      
      // Schedule additional renders to ensure visibility with fewer intervals
      const renderIntervals = [25, 50, 100, 200]; // Reduced intervals to minimize errors
      renderIntervals.forEach(interval => {
        setTimeout(() => {
          if (!viewer.isDestroyed() && viewer.scene) {
            viewer.scene.requestRender();
          }
        }, interval);
      });
    }
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}
