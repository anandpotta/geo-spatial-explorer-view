
import * as Cesium from 'cesium';

/**
 * Configures the Cesium globe appearance
 */
export function configureGlobeAppearance(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.globe) {
    console.warn('Invalid viewer or globe for configuration');
    return;
  }
  
  try {
    const globe = viewer.scene.globe;
    
    // Make the globe blue like Earth
    globe.baseColor = Cesium.Color.BLUE.withAlpha(1.0);
    
    // Enable lighting for better 3D appearance
    globe.enableLighting = true;
    
    // Disable water effects which require network resources
    globe.showWaterEffect = false;
    
    // Enable atmosphere glow
    globe.showGroundAtmosphere = true;
    
    // Disable terrain depth testing which can interfere with flat globe
    globe.depthTestAgainstTerrain = false;
    
    // Make sure the globe is visible
    globe.show = true;
    
    // Explicitly configure globe to be solid
    try {
      (globe as any)._surface._tileProvider._debug.wireframe = false;
    } catch (e) {
      // Safely ignore if this property isn't available
    }
  } catch (e) {
    console.error('Error configuring globe appearance:', e);
  }
}

/**
 * Configures scene background and fog
 */
export function configureSceneBackground(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    // Set a dark space background
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Disable fog which can interfere with visibility
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    // Hide celestial bodies
    if (viewer.scene.moon) {
      viewer.scene.moon.show = false;
    }
    
    if (viewer.scene.sun) {
      viewer.scene.sun.show = false;
    }
    
    if (viewer.scene.skyBox) {
      viewer.scene.skyBox.show = false;
    }
  } catch (e) {
    console.error('Error configuring scene background:', e);
  }
}

/**
 * Configures camera controls for better navigation
 */
export function configureCameraControls(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.screenSpaceCameraController) {
    return;
  }
  
  try {
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = true;
    controller.enableTranslate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;
  } catch (e) {
    console.error('Error configuring camera controls:', e);
  }
}
