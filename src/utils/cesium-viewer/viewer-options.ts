
/**
 * Creates minimal viewer options for Three.js globe usage
 * Note: This file is kept for compatibility but will be phased out
 * as we migrate fully to Three.js
 */
export function createOfflineCesiumViewerOptions(): any {
  // Return empty options object - we're transitioning to Three.js
  return {
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    vrButton: false,
    infoBox: false,
    useDefaultRenderLoop: true,
    contextOptions: {
      webgl: {
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true,
        stencil: false,
        depth: true,
        premultipliedAlpha: true
      }
    }
  };
}
