
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
      destination: Cesium.Cartesian3.fromDegrees(-98.0, 39.5, 10000000.0), // Centered over continental US with closer view
      orientation: {
        heading: Cesium.Math.toRadians(0.0),  // North-up orientation
        pitch: Cesium.Math.toRadians(-50.0),  // Look down at 50 degrees for better globe view
        roll: 0.0
      }
    });
    
    // Ensure Earth rotation is on but at a reasonable speed
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 20; // Slower rotation speed for better visibility
    
    // Set the scene background to black for space effect
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Configure globe appearance for better visibility
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      
      // Configure globe appearance with more saturated color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.2, 0.8, 1.0); // Richer blue for Earth
      
      // Enhanced atmosphere effect
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Force globe to be visible
      viewer.scene.globe.show = true;
      
      // Disable fog for clearer continental view
      viewer.scene.fog.enabled = false;
      
      // Enhanced lighting for better terrain visibility
      viewer.scene.globe.enableLighting = true;
    }
    
    console.log('Enhanced Earth view set with improved colors and visibility');
    
    // Force immediate render
    viewer.scene.requestRender();
    
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
  
  // Force immediate renders
  for (let i = 0; i < 30; i++) {
    viewer.scene.requestRender();
  }
  
  // Schedule additional renders at strategic intervals for progressive loading
  const renderIntervals = [50, 100, 200, 300, 500, 1000, 2000];
  
  renderIntervals.forEach(interval => {
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
