
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
    // Position the camera to show a more prominent Earth view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-98.0, 39.5, 8000000.0), // Closer view of Earth
      orientation: {
        heading: Cesium.Math.toRadians(0.0),  // North-up orientation
        pitch: Cesium.Math.toRadians(-45.0),  // Look down at angle
        roll: 0.0
      }
    });
    
    // Ensure Earth rotation is on but at a moderate speed
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 15; // Rotation speed
    
    // Set a pure black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Configure globe appearance for better visibility
    if (viewer.scene && viewer.scene.globe) {
      // Make sure the globe is visible
      viewer.scene.globe.show = true;
      
      // Configure globe appearance with vibrant blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
      
      // Enhanced atmosphere effect
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Enhanced lighting for better terrain visibility
      viewer.scene.globe.enableLighting = true;
      
      // Disable terrain depth testing to improve visibility
      viewer.scene.globe.depthTestAgainstTerrain = false;
    }
    
    // Disable fog for clearer view
    if (viewer.scene && viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    console.log('Enhanced Earth view set with improved colors and visibility');
    
    // Force immediate renders
    for (let i = 0; i < 30; i++) {
      viewer.scene.requestRender();
    }
    
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
  
  // Schedule additional renders at strategic intervals for progressive loading
  const renderIntervals = [50, 100, 200, 300, 500, 1000, 2000];
  
  renderIntervals.forEach((interval, index) => {
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        console.log(`Rendering globe at ${interval}ms interval`);
        viewer.scene.requestRender();
        
        // Force globe visibility at each interval
        if (viewer.scene && viewer.scene.globe) {
          // Make globe visible
          viewer.scene.globe.show = true;
          
          // Refresh globe appearance at different stages
          if (index === 2) { // Around 200ms - set initial color
            viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.2, 0.8, 1.0);
          }
          
          if (index === 4) { // Around 500ms - enhance color
            viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.9, 1.0);
            viewer.resize(); // Force resize
          }
        }
      }
    }, interval);
  });
}

