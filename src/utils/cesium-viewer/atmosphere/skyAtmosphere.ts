
import * as Cesium from 'cesium';

/**
 * Configures sky atmosphere settings for enhanced visibility
 */
export function configureSkyAtmosphere(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene?.skyAtmosphere) {
    return;
  }
  
  try {
    const skyAtmosphere = viewer.scene.skyAtmosphere;
    skyAtmosphere.show = true;
    
    // Set atmospheric properties for better visibility
    if ('hueShift' in skyAtmosphere) {
      skyAtmosphere.hueShift = 0.0;
      skyAtmosphere.saturationShift = 0.1;
      skyAtmosphere.brightnessShift = 3.0;
    }

    // Note: removed setDynamicLighting call that was causing errors
    
  } catch (e) {
    console.error('Error configuring sky atmosphere:', e);
  }
}
