
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
    // Force a bright, visible blue globe with improved settings and better performance
    if (viewer.scene && viewer.scene.globe) {
      // Use a vibrant but slightly darker blue for better visibility
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
      viewer.scene.globe.show = true;
      
      // Disable expensive effects for better performance
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = false;
      
      // Ensure the globe is fully opaque to avoid costly transparency calculations
      if (viewer.scene.globe.translucency) {
        viewer.scene.globe.translucency.enabled = false;
      }
      
      // Use a simple light for better performance
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: Cesium.Cartesian3.normalize(
          new Cesium.Cartesian3(1, 0, -1),
          new Cesium.Cartesian3()
        ),
        color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
        intensity: 2.0
      });
      
      // Disable shadows for better performance
      viewer.scene.shadowMap.enabled = false;
    }
    
    // Position the camera closer to Earth
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 20.0, 15000000.0),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-35.0),
        roll: 0.0
      }
    });
    
    // Optimize camera settings for performance
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000;
    
    // Set black background for better contrast and performance
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Force immediate renders but limit to reduce CPU usage
    for (let i = 0; i < 5; i++) {
      viewer.scene.requestRender();
    }
    
    console.log('Enhanced Earth view set with improved colors and visibility');
  } catch (error) {
    console.error('Failed to set default camera view:', error);
  }
}
