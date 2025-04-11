
import * as Cesium from 'cesium';

/**
 * Creates minimal viewer options for offline Cesium usage
 */
export function createOfflineCesiumViewerOptions(): Cesium.Viewer.ConstructorOptions {
  // Create a grid imagery provider with earth-like appearance
  const gridImageryProvider = new Cesium.GridImageryProvider({
    cells: 4,  // Smaller cells for more visible grid
    color: Cesium.Color.WHITE.withAlpha(0.3), // More visible grid lines
    glowColor: Cesium.Color.WHITE.withAlpha(0.4),
    backgroundColor: Cesium.Color.BLUE.withAlpha(0.3) // More noticeable blue tint
  });

  // Create the globe instance with proper configuration
  const globe = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
  globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0); // Brighter blue for better visibility
  globe.showGroundAtmosphere = true;
  globe.enableLighting = true;
  globe.translucency.enabled = false; // Disable translucency which could cause visibility issues
  globe.show = true; // Explicitly ensure globe is visible

  const skyAtmosphere = new Cesium.SkyAtmosphere();
  
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
    skyAtmosphere: skyAtmosphere, // Use our preconfigured skyAtmosphere
    globe: globe, // Use our preconfigured globe
    scene3DOnly: true, // Optimize for 3D only
    shouldAnimate: true, // Ensure the globe is animating
    orderIndependentTranslucency: true, // Enable for better atmospheric effects
    contextOptions: {
      webgl: {
        alpha: false, // Disable transparency for better performance
        antialias: true, // Enable antialiasing for smoother edges
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false, // Don't fail on performance issues
        preserveDrawingBuffer: true // Preserve drawing buffer for screenshots
      }
    },
    // Force immediate rendering
    useBrowserRecommendedResolution: false
  };
}
