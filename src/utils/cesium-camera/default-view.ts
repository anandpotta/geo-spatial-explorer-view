
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
    // Force a bright, visible blue globe with improved settings
    if (viewer.scene && viewer.scene.globe) {
      // Use an even brighter, more vibrant blue
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
      viewer.scene.globe.show = true;
      
      // Force globe visibility with enhanced settings
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = false; // Disable fog for better visibility
    }
    
    // Position much closer to the camera with adjusted pitch for better visibility
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 8000000.0), // Even closer position
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-20.0), // Better angle for globe visibility
        roll: 0.0
      }
    });
    
    // Set camera movement settings for better control
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000;
    
    // Pure black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Force immediate renders with multiple calls
    for (let i = 0; i < 50; i++) {
      viewer.scene.requestRender();
    }
    
    console.log('Enhanced Earth view set with improved colors and visibility');
    
    // Schedule strategic renders for better loading
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
  
  // More frequent intervals for the first few seconds
  const renderIntervals = [10, 30, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000];
  
  renderIntervals.forEach((interval) => {
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        console.log(`Rendering globe at ${interval}ms interval`);
        viewer.scene.requestRender();
        
        // Force globe visibility at each interval with brighter color
        if (viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.show = true;
          viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
        }
        
        // Ensure canvas is visible with high z-index
        if (viewer.canvas) {
          viewer.canvas.style.visibility = 'visible';
          viewer.canvas.style.display = 'block';
          viewer.canvas.style.opacity = '1';
          viewer.canvas.style.zIndex = '9999'; // Even higher z-index
        }
      }
    }, interval);
  });
}
