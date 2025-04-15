
import * as Cesium from 'cesium';
import { 
  configureSkyAtmosphere, 
  configureGlobeLighting,
  enhanceGlobeVisibility,
  ensureCanvasVisibility
} from './atmosphere';

/**
 * Configures atmosphere for the Earth glow effect
 */
export function configureAtmosphere(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  configureSkyAtmosphere(viewer);
  configureGlobeLighting(viewer);
  
  // Force multiple renders
  for (let i = 0; i < 30; i++) {
    viewer.scene.requestRender();
  }
}

/**
 * Configures rendering for better globe visibility
 */
export function configureRendering(viewer: Cesium.Viewer): void {
  if (!viewer?.scene?.globe) {
    return;
  }
  
  enhanceGlobeVisibility(viewer);
  ensureCanvasVisibility(viewer);
  
  // Force multiple render cycles
  for (let i = 0; i < 30; i++) {
    viewer.scene.requestRender();
  }
  
  // Enable animation for globe rotation
  viewer.clock.shouldAnimate = true;
  viewer.clock.multiplier = 2.0;
  
  // Add a CSS rule to ensure all .cesium-widget elements are visible
  const style = document.createElement('style');
  style.textContent = `
    body .cesium-widget, 
    body .cesium-widget canvas, 
    body .cesium-viewer {
      visibility: visible !important;
      display: block !important;
      opacity: 1 !important;
      z-index: 10000 !important;
      background: #000 !important;
    }
    
    /* Override any other styles that might be hiding the globe */
    body .cesium-viewer-cesiumWidgetContainer {
      visibility: visible !important;
      display: block !important;
      width: 100% !important;
      height: 100% !important;
    }
  `;
  document.head.appendChild(style);
  
  // Force one more resize and render
  viewer.resize();
  viewer.scene.requestRender();
}

/**
 * Forces immediate rendering of the globe with enhanced visibility
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer?.scene?.globe) {
    return;
  }
  
  // Make the globe much more visible
  viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
  viewer.scene.globe.show = true;
  
  // Use a bright light to illuminate the globe
  viewer.scene.light = new Cesium.DirectionalLight({
    direction: Cesium.Cartesian3.normalize(
      new Cesium.Cartesian3(4, 4, -1),
      new Cesium.Cartesian3()
    ),
    color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
  });
  
  // Set black background for better contrast
  viewer.scene.backgroundColor = Cesium.Color.BLACK;
  
  // Enable atmospheric effects
  viewer.scene.skyAtmosphere.show = true;
  viewer.scene.globe.showGroundAtmosphere = true;
  
  // Force multiple renders
  for (let i = 0; i < 30; i++) {
    viewer.scene.requestRender();
  }
  
  // Ensure canvas is visible
  ensureCanvasVisibility(viewer);
}
