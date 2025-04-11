
import * as Cesium from 'cesium';

/**
 * Sets an initial default view for the Cesium camera
 */
export function setDefaultCameraView(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.camera) {
    console.warn('Invalid viewer or camera for default view');
    return;
  }

  try {
    // Position the camera to show North America view with optimized parameters
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-98.0, 39.5, 12000000.0), // Centered over continental US
      orientation: {
        heading: Cesium.Math.toRadians(0.0),  // North-up orientation
        pitch: Cesium.Math.toRadians(-60.0),  // Look down at a steeper angle for better continent view
        roll: 0.0
      }
    });
    
    // Ensure Earth rotation is on but at a reasonable speed
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 50; // Slightly slower rotation speed for better user experience
    
    // Set the scene background to black for space effect
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Configure globe appearance for better visibility
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      
      // Configure globe appearance to match NASA Blue Marble style
      viewer.scene.globe.baseColor = Cesium.Color.DARKBLUE.withAlpha(1.0); 
      
      // Enhance atmosphere effect for better edge glow
      if (viewer.scene.skyAtmosphere) {
        // Check if skyAtmosphere is a boolean
        if (typeof viewer.scene.skyAtmosphere !== 'boolean') {
          // Only add properties if it's an object
          if ('hueShift' in viewer.scene.skyAtmosphere) {
            viewer.scene.skyAtmosphere.hueShift = 0.0;
            viewer.scene.skyAtmosphere.saturationShift = 0.1;
            viewer.scene.skyAtmosphere.brightnessShift = 0.95; // Slightly brighter atmosphere
          }
        }
      }
      
      // Disable fog for clearer continental view
      viewer.scene.fog.enabled = false;
      
      // Enhanced lighting for better terrain visibility
      viewer.scene.globe.enableLighting = true;
      
      // Optimize scene for better performance
      viewer.scene.globe.maximumScreenSpaceError = 2.0; // Lower for better quality
      if (viewer.scene.globe.tileCacheSize !== undefined) {
        viewer.scene.globe.tileCacheSize = 1000; // Larger tile cache for smoother interaction
      }
    }
    
    console.log('Enhanced North America view set at height: 12000000.0m');
    
    // Request additional renders to ensure the globe appears properly
    requestProgressiveRenders(viewer);
    
  } catch (error) {
    console.error('Failed to set default camera view:', error);
  }
}

/**
 * Helper for multiple staged renders to ensure globe visibility
 */
function requestProgressiveRenders(viewer: Cesium.Viewer): void {
  if (!viewer || viewer.isDestroyed()) return;
  
  // Force additional renders to ensure the globe appears
  for (let i = 0; i < 20; i++) {
    viewer.scene.requestRender();
  }
  
  // Schedule additional renders after short delays for progressive loading
  setTimeout(() => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.scene.requestRender();
    }
  }, 100);
  
  setTimeout(() => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.scene.requestRender();
    }
  }, 300);
  
  setTimeout(() => {
    if (viewer && !viewer.isDestroyed()) {
      for (let i = 0; i < 5; i++) {
        viewer.scene.requestRender();
      }
    }
  }, 500);
}
