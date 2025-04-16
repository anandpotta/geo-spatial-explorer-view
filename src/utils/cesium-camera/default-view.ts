
import * as Cesium from 'cesium';

/**
 * Sets an initial default view for the Cesium camera with optimized performance
 */
export function setDefaultCameraView(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.camera) {
    console.warn('Invalid viewer or camera for default view');
    return;
  }

  try {
    // Configure globe for visibility
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.6, 1.0, 1.0);
      viewer.scene.globe.show = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.skyAtmosphere.show = true;
      
      // Add lighting for better visibility
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: Cesium.Cartesian3.normalize(
          new Cesium.Cartesian3(1, 0, -1),
          new Cesium.Cartesian3()
        ),
        color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
        intensity: 2.0
      });
    }
    
    // Position the camera for a good Earth view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 15.0, 15000000.0),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-30.0),
        roll: 0.0
      }
    });
    
    // Set camera limits
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000;
    
    // Set black background
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Force multiple renders
    for (let i = 0; i < 10; i++) {
      viewer.scene.requestRender();
    }
    
    console.log('Enhanced Earth view set with improved visibility');
  } catch (error) {
    console.error('Failed to set default camera view:', error);
  }
}
