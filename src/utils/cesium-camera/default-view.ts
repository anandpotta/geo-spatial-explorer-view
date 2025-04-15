
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
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.6, 1.0, 1.0);
      viewer.scene.globe.show = true;
      
      // Force globe visibility with enhanced settings
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = false; // Disable fog for better visibility
      
      // Ensure the globe is fully opaque - using the correct type
      if (viewer.scene.globe.translucency) {
        viewer.scene.globe.translucency.enabled = false;
      }
      
      // Set stronger lighting
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: Cesium.Cartesian3.normalize(
          new Cesium.Cartesian3(1, 0, -1),
          new Cesium.Cartesian3()
        ),
        color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
        intensity: 2.0
      });
    }
    
    // Position the camera at a better angle and closer for improved visibility
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 20.0, 8000000.0), // Closer to Earth, slightly tilted view
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-45.0), // Increased angle looking down at globe
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
  } catch (error) {
    console.error('Failed to set default camera view:', error);
  }
}
