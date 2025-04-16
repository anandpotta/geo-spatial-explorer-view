
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
    // Set globe appearance
    viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.6, 1.0, 1.0);
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.skyAtmosphere.show = true;
    
    // Set background color to black
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Ensure the globe is visible
    forceGlobeVisibility(viewer);
    
    // Force rendering
    for (let i = 0; i < 20; i++) {
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
  
  // Force sky atmosphere on
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = true;
  }
  
  // Ensure the canvas is properly sized
  viewer.resize();
  
  // Request render multiple times
  for (let i = 0; i < 10; i++) {
    viewer.scene.requestRender();
  }
}
