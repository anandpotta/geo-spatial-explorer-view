
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
      // Use a vibrant but slightly darker blue for better visibility
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
      viewer.scene.globe.show = true;
      
      // Force globe visibility with enhanced settings
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.enableLighting = false; // Disable lighting for more consistent color
      viewer.scene.skyAtmosphere.show = true;
      
      // Reduce brightness settings to avoid washing out the globe
      if ('hueShift' in viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.1;
        viewer.scene.skyAtmosphere.brightnessShift = 0.5; // Lower brightness
      }
      viewer.scene.fog.enabled = false; // Disable fog for better visibility
      
      // Ensure the globe is fully opaque
      if (viewer.scene.globe.translucency) {
        viewer.scene.globe.translucency.enabled = false;
      }
      
      // Set moderate lighting for better visibility
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: Cesium.Cartesian3.normalize(
          new Cesium.Cartesian3(1, 0, -1),
          new Cesium.Cartesian3()
        ),
        color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
        intensity: 2.0  // Moderate light intensity
      });
      
      // Disable shadows for better performance and visibility
      viewer.scene.shadowMap.enabled = false;
    }
    
    // Position the camera closer to Earth
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 20.0, 15000000.0), // Closer to Earth
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-35.0), // Better viewing angle
        roll: 0.0
      }
    });
    
    // Set camera movement settings for better control
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000;
    
    // Pure black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Force immediate renders
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
    
    console.log('Enhanced Earth view set with improved colors and visibility');
  } catch (error) {
    console.error('Failed to set default camera view:', error);
  }
}
