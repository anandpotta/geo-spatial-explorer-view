
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
    .cesium-widget, .cesium-widget canvas, .cesium-viewer {
      visibility: visible !important;
      display: block !important;
      opacity: 1 !important;
      z-index: 10000 !important;
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
  
  enhanceGlobeVisibility(viewer);
  ensureCanvasVisibility(viewer);
  
  // Force multiple renders
  for (let i = 0; i < 30; i++) {
    viewer.scene.requestRender();
  }
}
