
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
      
      // Request renders to ensure atmosphere is visible
      for (let i = 0; i < 30; i++) { // Increased render cycles
        viewer.scene.requestRender();
      }
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
    // Remove post-processing which may rely on network resources
    if (viewer.scene.postProcessStages && typeof viewer.scene.postProcessStages.removeAll === 'function') {
      viewer.scene.postProcessStages.removeAll();
    }
    
    // Enhanced globe visibility settings
    if (viewer.scene.globe) {
      // Make sure globe is shown
      viewer.scene.globe.show = true;
      
      // Set a vibrant blue color for the globe
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.7, 1.0, 1.0); // Brighter blue
    }
    
    // Force multiple render cycles to ensure the globe appears
    for (let i = 0; i < 90; i++) { // Increased render cycles
      viewer.scene.requestRender();
    }
    
    // Schedule additional renders to ensure visibility
    const renderIntervals = [25, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500]; // More frequent renders
    renderIntervals.forEach(interval => {
      setTimeout(() => {
        if (!viewer.isDestroyed() && viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.show = true;
          viewer.scene.requestRender();
          
          // Force resize occasionally
          if (interval % 200 === 0) {
            viewer.forceResize();
          }
        }
      }, interval);
    });
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}
