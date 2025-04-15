
import * as Cesium from 'cesium';

/**
 * Forces globe visibility with enhanced settings
 */
export function enhanceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene?.globe) {
    return;
  }
  
  try {
    const globe = viewer.scene.globe;
    globe.show = true;
    globe.baseColor = new Cesium.Color(0.0, 1.0, 1.0, 1.0);
    globe.showGroundAtmosphere = true;
    globe.enableLighting = true;
    
    // Force background to be black for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Make globe fully opaque
    if ('translucency' in globe) {
      globe.translucency.enabled = false;
      globe.translucency.frontFaceAlpha = 1.0;
      globe.translucency.backFaceAlpha = 1.0;
    }
    
    // Disable fog for better visibility
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
  } catch (e) {
    console.error('Error enhancing globe visibility:', e);
  }
}

/**
 * Ensures the canvas is fully visible
 */
export function ensureCanvasVisibility(viewer: Cesium.Viewer): void {
  if (!viewer?.canvas) {
    return;
  }
  
  try {
    const canvas = viewer.canvas;
    canvas.style.visibility = 'visible';
    canvas.style.display = 'block';
    canvas.style.opacity = '1';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '10000';
    
    if (canvas.width === 0 || canvas.height === 0) {
      const containerElement = canvas.parentElement;
      if (containerElement) {
        containerElement.style.width = '100%';
        containerElement.style.height = '100%';
        containerElement.style.minWidth = '300px';
        containerElement.style.minHeight = '300px';
      }
      viewer.resize();
    }
  } catch (e) {
    console.error('Error ensuring canvas visibility:', e);
  }
}
