
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
        viewer.scene.skyAtmosphere.brightnessShift = 1.0;
      }
    }
    
    // Ensure lighting for dramatic effect
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Force the globe to be visible with a bright pure blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
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
    // Set a vibrant blue color for the globe if available
    if (viewer.scene.globe) {
      // Make sure globe is shown
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
    }
    
    // Force multiple render cycles to ensure the globe appears
    for (let i = 0; i < 3; i++) {
      viewer.scene.requestRender();
    }
    
    // Set up globe automatic rotation if not already rotating
    if (!viewer.clock.shouldAnimate) {
      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = 2.0; // Speed of rotation
    }
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}
