
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
        viewer.scene.skyAtmosphere.brightnessShift = 0.8;
      }
    }
    
    // Ensure lighting for dramatic effect
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Force the globe to be visible with a bright pure blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
      viewer.scene.globe.show = true;
      
      // Request renders to ensure atmosphere is visible
      for (let i = 0; i < 20; i++) {
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
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
    }
    
    // Force multiple render cycles to ensure the globe appears
    for (let i = 0; i < 60; i++) {
      viewer.scene.requestRender();
    }
    
    // Schedule additional renders to ensure visibility
    const renderIntervals = [50, 100, 200, 300, 500, 1000];
    renderIntervals.forEach(interval => {
      setTimeout(() => {
        if (!viewer.isDestroyed() && viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.show = true;
          viewer.scene.requestRender();
          
          // Force resize occasionally
          if (interval % 300 === 0) {
            viewer.forceResize();
          }
        }
      }, interval);
    });
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}
