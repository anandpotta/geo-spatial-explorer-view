
import * as Cesium from 'cesium';

/**
 * Configures globe lighting and atmospheric effects
 */
export function configureGlobeLighting(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene?.globe) {
    return;
  }
  
  try {
    const globe = viewer.scene.globe;
    globe.enableLighting = true;
    globe.showGroundAtmosphere = true;
    
    // Set a more vibrant blue color
    globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
    globe.show = true;
    
    // Disable translucency which can cause visibility issues
    if ('translucency' in globe) {
      globe.translucency.enabled = false;
    }
  } catch (e) {
    console.error('Error configuring globe lighting:', e);
  }
}
