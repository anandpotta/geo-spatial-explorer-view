
import * as Cesium from 'cesium';

/**
 * Creates minimal viewer options for offline Cesium usage
 */
export function createOfflineCesiumViewerOptions(): Cesium.Viewer.ConstructorOptions {
  // Create a more visible grid imagery provider
  const gridImageryProvider = new Cesium.GridImageryProvider({
    cells: 2,  // Larger cells for better visibility
    color: Cesium.Color.WHITE.withAlpha(0.9), // More visible grid lines
    glowColor: Cesium.Color.WHITE.withAlpha(0.9),
    backgroundColor: new Cesium.Color(0.0, 0.8, 1.0, 1.0) // Brighter blue for visibility
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
    // Use the baseLayer property instead of imageryProvider
    baseLayer: new Cesium.ImageryLayer(gridImageryProvider),
    terrainProvider: new Cesium.EllipsoidTerrainProvider({
      ellipsoid: Cesium.Ellipsoid.WGS84
    }),
    requestRenderMode: false,  // Always render continuously for better visibility
    maximumRenderTimeChange: Infinity,
    targetFrameRate: 60, // Higher framerate for smoother rotation
    shadows: false,
    skyBox: false, // We'll handle atmosphere separately
    scene3DOnly: true, // Optimize for 3D only
    shouldAnimate: true, // Ensure the globe is animating
    orderIndependentTranslucency: true, // Enable for better atmospheric effects
    automaticallyTrackDataSourceClocks: false, // Disable to improve performance
    contextOptions: {
      webgl: {
        alpha: false, // Disable transparency for better rendering
        antialias: true, // Enable antialiasing for smoother edges
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false, // Don't fail on performance issues
        preserveDrawingBuffer: true, // Ensure rendering is preserved
        stencil: false, // Disable stencil for better performance
        depth: true // Enable depth testing
      }
    },
    useDefaultRenderLoop: true, // Use the default render loop for consistent rendering
    sceneMode: Cesium.SceneMode.SCENE3D // Force 3D mode
  };
}
