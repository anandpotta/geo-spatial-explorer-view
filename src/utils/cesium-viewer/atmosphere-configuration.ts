
import * as Cesium from 'cesium';

/**
 * Configures atmosphere for the Earth glow effect
 */
export function configureAtmosphere(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    const skyAtmosphere = viewer.scene.skyAtmosphere;
    
    // Check if skyAtmosphere is defined and is an object (not a boolean)
    if (skyAtmosphere && typeof skyAtmosphere === 'object') {
      // Only set properties if it's an object with properties
      if ('show' in skyAtmosphere) {
        skyAtmosphere.show = true;
      }
      
      if ('hueShift' in skyAtmosphere) {
        skyAtmosphere.hueShift = 0.0;
        skyAtmosphere.saturationShift = 0.1;
        skyAtmosphere.brightnessShift = 0.8;
      }
    }
    
    // Ensure lighting for dramatic effect
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      
      // Force the globe to be visible with a vibrant blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
      viewer.scene.globe.show = true;
      
      // Request renders to ensure atmosphere is visible
      for (let i = 0; i < 5; i++) {
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
      
      // Set a rich blue color for the globe
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
    }
    
    // Force multiple render cycles to ensure the globe appears
    for (let i = 0; i < 30; i++) {
      viewer.scene.requestRender();
    }
    
    // Ensure canvas has proper dimensions
    if (viewer.canvas) {
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
    }
    
    // Schedule additional renders to ensure visibility
    const renderIntervals = [100, 500, 1000, 2000];
    renderIntervals.forEach(interval => {
      setTimeout(() => {
        if (!viewer.isDestroyed() && viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.show = true;
          viewer.scene.requestRender();
        }
      }, interval);
    });
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}

