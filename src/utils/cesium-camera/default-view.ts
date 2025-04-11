
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
    // Position the camera to show a more prominent Earth view - closer to Earth
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 10000000.0), // Closer view of Earth
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-45.0), // Steeper angle for better Earth visibility
        roll: 0.0
      }
    });
    
    // Set more aggressive camera movement settings
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000; // Don't let users zoom in too close
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000; // Don't let users zoom out too far
    
    // Set a pure black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Configure globe appearance for better visibility
    if (viewer.scene && viewer.scene.globe) {
      // Make sure the globe is visible
      viewer.scene.globe.show = true;
      
      // Configure globe appearance with more vibrant blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0); // More vibrant blue
      
      // Enhanced atmosphere effect
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Enhanced lighting for better terrain visibility
      viewer.scene.globe.enableLighting = true;
    }
    
    // Disable fog for clearer view
    if (viewer.scene && viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    console.log('Enhanced Earth view set with improved colors and visibility');
    
    // Force immediate renders
    for (let i = 0; i < 5; i++) {
      viewer.scene.requestRender();
    }
  } catch (error) {
    console.error('Failed to set default camera view:', error);
  }
}

/**
 * Helper for multiple staged renders to ensure globe visibility
 */
function requestProgressiveRenders(viewer: Cesium.Viewer): void {
  if (!viewer || viewer.isDestroyed()) return;
  
  // Schedule additional renders at strategic intervals for progressive loading
  const renderIntervals = [10, 50, 100, 250, 500, 1000];
  
  renderIntervals.forEach((interval) => {
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        console.log(`Rendering globe at ${interval}ms interval`);
        viewer.scene.requestRender();
        
        // Force globe visibility at each interval
        if (viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.show = true;
        }
      }
    }, interval);
  });
}
