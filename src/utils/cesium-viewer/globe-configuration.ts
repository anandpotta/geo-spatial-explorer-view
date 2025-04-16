
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
    globe.baseColor = new Cesium.Color(0.0, 0.6, 1.0, 1.0);
    
    // Enable lighting for better 3D appearance
    globe.enableLighting = true;
    
    // Disable water effects which require network resources
    globe.showWaterEffect = false;
    
    // Enable atmosphere glow
    globe.showGroundAtmosphere = true;
    
    // Make sure the globe is visible
    globe.show = true;
    
    // Set high detail rendering
    if ('tileCacheSize' in globe) {
      (globe as any).tileCacheSize = 1000;
    }
    
    // Force multiple renders
    if (viewer.scene) {
      for (let i = 0; i < 20; i++) {
        viewer.scene.requestRender();
      }
    }
    
    // Set shadow mode to improve visibility
    if (viewer.scene.globe) {
      viewer.scene.globe.shadows = Cesium.ShadowMode.ENABLED;
    }
    
    console.log('Globe appearance configured with improved visibility');
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
    
    // Disable fog
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    // Configure celestial bodies
    if (viewer.scene.moon) {
      viewer.scene.moon.show = false;
    }
    
    if (viewer.scene.sun) {
      viewer.scene.sun.show = true;
    }
    
    if (viewer.scene.skyBox) {
      viewer.scene.skyBox.show = false;
    }
    
    // Add strong light source for better globe visibility
    viewer.scene.light = new Cesium.DirectionalLight({
      direction: Cesium.Cartesian3.normalize(
        new Cesium.Cartesian3(4, 4, -1),
        new Cesium.Cartesian3()
      ),
      color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
      intensity: 2.0
    });
    
    // Force scene to render multiple times
    for (let i = 0; i < 10; i++) {
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
    
    // Set zoom distances
    controller.minimumZoomDistance = 100000;
    controller.maximumZoomDistance = 25000000;
    
    // Improve camera inertia settings
    if ('inertiaSpin' in controller) {
      (controller as any).inertiaSpin = 0.9;
      (controller as any).inertiaZoom = 0.8;
      (controller as any).inertiaPan = 0.9;
    }
  } catch (e) {
    console.error('Error configuring camera controls:', e);
  }
}

/**
 * Forces the globe visibility with multiple techniques
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || viewer.isDestroyed()) return;
  
  try {
    // Force resize to trigger redraws
    viewer.resize();
    
    // Make globe visible
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      
      // Set bright color for visibility
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.6, 1.0, 1.0);
    }
    
    // Force canvas to be visible
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
      viewer.canvas.style.zIndex = '99999';
    }
    
    // Multiple render requests
    for (let i = 0; i < 10; i++) {
      viewer.scene.requestRender();
    }
  } catch (e) {
    console.error('Error forcing globe visibility:', e);
  }
}
