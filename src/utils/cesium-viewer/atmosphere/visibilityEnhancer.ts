
import * as Cesium from 'cesium';

/**
 * Makes the globe more visible with enhanced settings
 */
export function enhanceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer?.scene?.globe) {
    return;
  }
  
  // Use a much more vibrant color that will be visible in any environment
  viewer.scene.globe.baseColor = new Cesium.Color(0.3, 0.6, 1.0, 1.0);
  
  // Force the globe to be shown
  viewer.scene.globe.show = true;
  
  // Enable atmosphere features for better visibility
  viewer.scene.skyAtmosphere.show = true;
  viewer.scene.globe.showGroundAtmosphere = true;
  
  // Disable fog which can obscure the globe
  viewer.scene.fog.enabled = false;
  
  // Set globe properties for better visibility
  viewer.scene.globe.enableLighting = true;
  
  // Make sure we're showing the globe in full brightness
  if ('brightness' in viewer.scene) {
    (viewer.scene as any).brightness = 1.0;
  }
  
  // Force the scene to use a black background for better contrast with the blue globe
  viewer.scene.backgroundColor = Cesium.Color.BLACK;
  
  // Ensure the scene is properly lit
  viewer.scene.light = new Cesium.DirectionalLight({
    direction: Cesium.Cartesian3.normalize(
      new Cesium.Cartesian3(4, 4, -1),
      new Cesium.Cartesian3()
    ),
    color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
  });
}

/**
 * Ensures the canvas element is visible with appropriate CSS properties
 */
export function ensureCanvasVisibility(viewer: Cesium.Viewer): void {
  if (!viewer?.canvas) {
    return;
  }
  
  // Force canvas to be visible
  viewer.canvas.style.visibility = 'visible';
  viewer.canvas.style.display = 'block';
  viewer.canvas.style.opacity = '1';
  
  // Add high z-index to ensure it's on top of other elements
  viewer.canvas.style.zIndex = '9999';
  
  // Add additional CSS to force visibility
  const style = document.createElement('style');
  style.textContent = `
    .cesium-widget, .cesium-widget canvas, .cesium-viewer, .cesium-viewer canvas {
      visibility: visible !important;
      display: block !important;
      opacity: 1 !important;
      z-index: 10000 !important;
    }
  `;
  document.head.appendChild(style);
}
