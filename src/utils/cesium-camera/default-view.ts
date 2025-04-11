
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
    // Position the camera to show a more prominent Earth view - much closer to Earth
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-98.0, 39.5, 4000000.0), // Much closer view of Earth
      orientation: {
        heading: Cesium.Math.toRadians(0.0),  // North-up orientation
        pitch: Cesium.Math.toRadians(-25.0),  // Look down at less extreme angle
        roll: 0.0
      }
    });
    
    // Ensure Earth rotation is on but at a moderate speed
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 3; // Slower rotation for better initial visibility
    
    // Set a pure black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Configure globe appearance for better visibility
    if (viewer.scene && viewer.scene.globe) {
      // Make sure the globe is visible
      viewer.scene.globe.show = true;
      
      // Configure globe appearance with vibrant blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.4, 1.0, 1.0);
      
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
    
    // Force immediate renders - more renders for better visibility
    for (let i = 0; i < 60; i++) {
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
  // More frequent renders at the beginning with more intervals
  const renderIntervals = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000];
  
  renderIntervals.forEach((interval, index) => {
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        console.log(`Rendering globe at ${interval}ms interval`);
        viewer.scene.requestRender();
        
        // Force globe visibility at each interval
        if (viewer.scene && viewer.scene.globe) {
          // Make globe visible
          viewer.scene.globe.show = true;
          
          // Refresh globe appearance at different stages with increasing intensity
          const intensity = Math.min(0.9, 0.4 + (index * 0.03));
          viewer.scene.globe.baseColor = new Cesium.Color(0.0, intensity, 1.0, 1.0);
          
          if (index % 3 === 0) { // Every third interval - force resize
            viewer.resize(); 
          }
          
          if (index === 7) { // Around 300ms - force resize
            viewer.resize(); 
          }
          
          if (index === 12) { // Around 1500ms - force another resize
            viewer.resize(); 
          }
        }
      }
    }, interval);
  });
}
