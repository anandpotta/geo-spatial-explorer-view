
import * as Cesium from 'cesium';

/**
 * Configures the globe appearance with improved visibility settings
 */
export function configureGlobeAppearance(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.globe) {
    console.warn('Invalid viewer for globe configuration');
    return;
  }

  try {
    // Set globe appearance with more vibrant colors
    viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.6, 1.0, 1.0);
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.skyAtmosphere.show = true;
    
    // Force visibility
    viewer.scene.globe.show = true;
    
    // Set background color to black for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Ensure the globe is visible
    forceGlobeVisibility(viewer);
    
    // Force rendering multiple times
    for (let i = 0; i < 50; i++) { // Increased render cycles
      viewer.scene.requestRender();
    }
    
    console.log('Globe appearance configured with improved visibility');
  } catch (error) {
    console.error('Failed to configure globe appearance:', error);
  }
}

/**
 * Forces the globe to be visible by directly setting critical visibility properties
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.globe) {
    return;
  }
  
  // Ensure the globe is visible
  viewer.scene.globe.show = true;
  
  // Set more vibrant color
  viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.6, 1.0, 1.0);
  
  // Force opacity settings
  if ('_surface' in viewer.scene.globe) {
    const globe = viewer.scene.globe as any;
    if (globe._surface) {
      globe._surface._tileProvider.ready = true;
      
      if (globe._surface._tileProvider._quadtree) {
        globe._surface._tileProvider._quadtree.show = true;
      }
    }
  }
  
  // Force sky atmosphere on with high brightness
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = true;
    // Add lighting for better visibility
    viewer.scene.light = new Cesium.DirectionalLight({
      direction: Cesium.Cartesian3.normalize(
        new Cesium.Cartesian3(1, 0, -1), 
        new Cesium.Cartesian3()
      ),
      color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
      intensity: 5.0  // Increased intensity
    });
  }
  
  // Ensure the canvas is properly sized and visible
  if (viewer.canvas) {
    viewer.canvas.style.visibility = 'visible';
    viewer.canvas.style.display = 'block';
    viewer.canvas.style.opacity = '1';
    viewer.canvas.style.zIndex = '9999';
  }
  
  // Ensure the canvas is properly sized
  viewer.resize();
  
  // Request render multiple times
  for (let i = 0; i < 30; i++) { // Increased render cycles
    viewer.scene.requestRender();
  }
}

/**
 * Configures the scene background and celestial bodies
 */
export function configureSceneBackground(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }

  try {
    // Set background color to black for better contrast with the blue globe
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Disable skybox to avoid distractions
    if (viewer.scene.skyBox) {
      viewer.scene.skyBox.show = false;
    }
    
    // Ensure the globe is shown
    if (viewer.scene.globe) {
      viewer.scene.globe.show = true;
    }
    
    // Force multiple renders
    for (let i = 0; i < 10; i++) {
      viewer.scene.requestRender();
    }
    
    console.log('Scene background configured');
  } catch (error) {
    console.error('Failed to configure scene background:', error);
  }
}

/**
 * Configures camera controls for better user experience
 */
export function configureCameraControls(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.camera) {
    return;
  }

  try {
    // Set camera limits
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000000; // Don't allow zooming too close
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000; // Don't allow zooming too far
    
    // Improve camera movement
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableTranslate = true;
    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.enableTilt = true;
    viewer.scene.screenSpaceCameraController.enableLook = false;
    
    console.log('Camera controls configured');
  } catch (error) {
    console.error('Failed to configure camera controls:', error);
  }
}
