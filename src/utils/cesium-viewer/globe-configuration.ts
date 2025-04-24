
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
    
    // Make the globe blue like Earth - with much more vibrant color
    globe.baseColor = new Cesium.Color(0.3, 0.6, 1.0, 1.0);
    
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
    
    // Force the globe to use high detail rendering
    if ('tileCacheSize' in globe) {
      (globe as any).tileCacheSize = 1000; // Use a larger tile cache for better rendering
    }
    
    // Increase material cache size for better appearance
    if ('materialCache' in globe) {
      try {
        (globe as any).materialCache.maximumSize = 1000;
      } catch (e) {
        // Ignore if not available
      }
    }
    
    // Request a render to update the globe - multiple times
    if (viewer.scene) {
      // Request many more renders to ensure globe becomes visible
      for (let i = 0; i < 50; i++) {
        viewer.scene.requestRender();
      }
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
    
    // Hide celestial bodies to focus on the globe
    if (viewer.scene.moon) {
      viewer.scene.moon.show = false;
    }
    
    if (viewer.scene.sun) {
      viewer.scene.sun.show = true; // Keep sun for better lighting
    }
    
    if (viewer.scene.skyBox) {
      viewer.scene.skyBox.show = false;
    }
    
    // Add light source for better globe visibility
    viewer.scene.light = new Cesium.DirectionalLight({
      direction: Cesium.Cartesian3.normalize(
        new Cesium.Cartesian3(4, 4, -1),
        new Cesium.Cartesian3()
      ),
      color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
    });
    
    // Force scene to render multiple times
    for (let i = 0; i < 30; i++) {
      viewer.scene.requestRender();
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
    
    // Set minimum and maximum zoom distances for better user experience
    controller.minimumZoomDistance = 100000; // Don't let users zoom in too close
    controller.maximumZoomDistance = 25000000; // Don't let users zoom out too far
    
    // Improve camera inertia settings for smoother movement
    if ('inertiaSpin' in controller) {
      (controller as any).inertiaSpin = 0.9;
      (controller as any).inertiaZoom = 0.8;
      (controller as any).inertiaPan = 0.9;
    }
  } catch (e) {
    console.error('Error configuring camera controls:', e);
  }
}
