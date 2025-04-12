
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
    // Force a bright, visible blue globe
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
      viewer.scene.globe.show = true;
      
      // Force the globe to be visible with multiple settings
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyAtmosphere.show = true;
    }
    
    // Position the camera to show a full Earth view from distance
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 15000000.0), // Adjusted position for better view
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-20.0), // Adjusted angle to see more of globe
        roll: 0.0
      }
    });
    
    // Set more aggressive camera movement settings
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000; // Don't let users zoom in too close
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000; // Don't let users zoom out too far
    
    // Set a pure black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Disable fog for clearer view
    if (viewer.scene && viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }

    // Force immediate renders
    for (let i = 0; i < 30; i++) {
      viewer.scene.requestRender();
    }
    
    console.log('Enhanced Earth view set with improved colors and visibility');
    
    // Schedule progressive renders for better loading
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
  
  // Schedule additional renders at strategic intervals for progressive loading
  const renderIntervals = [10, 50, 100, 250, 500, 750, 1000, 1500, 2000, 3000];
  
  renderIntervals.forEach((interval) => {
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        console.log(`Rendering globe at ${interval}ms interval`);
        viewer.scene.requestRender();
        
        // Force globe visibility at each interval
        if (viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.show = true;
          viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
        }
      }
    }, interval);
  });
}
