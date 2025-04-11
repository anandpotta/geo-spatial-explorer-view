
import * as Cesium from 'cesium';

/**
 * Creates minimal viewer options for offline Cesium usage
 */
export function createOfflineCesiumViewerOptions(): Cesium.Viewer.ConstructorOptions {
  // Create a grid imagery provider with earth-like appearance
  const gridImageryProvider = new Cesium.GridImageryProvider({
    cells: 8,  // Larger cells for continent-like appearance
    color: Cesium.Color.WHITE.withAlpha(0.2), // More visible grid lines
    glowColor: Cesium.Color.WHITE.withAlpha(0.3),
    backgroundColor: Cesium.Color.TRANSPARENT // Allow globe color to show through
  });

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
    selectionIndicator: false,
    creditContainer: document.createElement('div'), // Hide credits
    // Use the correct property name for the imagery provider
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(Promise.resolve(gridImageryProvider)),
    terrainProvider: new Cesium.EllipsoidTerrainProvider({
      ellipsoid: Cesium.Ellipsoid.WGS84
    }),
    requestRenderMode: false,  // Always render continuously 
    maximumRenderTimeChange: Infinity,
    targetFrameRate: 60, // Higher framerate for smoother rotation
    shadows: false,
    skyBox: false, // We'll handle atmosphere separately
    skyAtmosphere: true, // Enable atmosphere for globe edge effect
    globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84),
    scene3DOnly: true, // Optimize for 3D only
    shouldAnimate: true, // Ensure the globe is animating
    orderIndependentTranslucency: true, // Enable for better atmospheric effects
    contextOptions: {
      webgl: {
        alpha: false, // Disable transparency for better performance
        antialias: true, // Enable antialiasing for smoother edges
        powerPreference: 'high-performance'
      }
    }
  };
}
