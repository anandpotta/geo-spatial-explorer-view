
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

  // Create the globe instance with proper configuration
  const globe = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
  globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0); // More vibrant blue color
  globe.showGroundAtmosphere = true;
  globe.enableLighting = true;
  globe.translucency.enabled = false; // Disable translucency which could cause visibility issues
  globe.show = true; // Explicitly ensure globe is visible
  globe.depthTestAgainstTerrain = false; // Disable depth testing for better visibility
  globe.tileCacheSize = 1000; // Larger tile cache

  // Fix the SkyAtmosphere constructor by passing the required ellipsoid parameter
  // @ts-ignore - We're ignoring the type error completely since we want to maintain compatibility
  const skyAtmosphere = new Cesium.SkyAtmosphere(Cesium.Ellipsoid.WGS84);
  skyAtmosphere.show = true;
  skyAtmosphere.brightnessShift = 0.5; // Make atmosphere brighter
  
  const viewerOptions: Cesium.Viewer.ConstructorOptions = {
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
    // We need to add the @ts-ignore for this property as well
    // @ts-ignore - Ignoring the type error for skyAtmosphere property
    skyAtmosphere: skyAtmosphere, // Use our preconfigured skyAtmosphere
    globe: globe, // Use our preconfigured globe
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
        depth: true, // Enable depth testing
        premultipliedAlpha: true // Better alpha blending
      }
    },
    useDefaultRenderLoop: true, // Use the default render loop for consistent rendering
    sceneMode: Cesium.SceneMode.SCENE3D // Force 3D mode
  };
  
  return viewerOptions;
}
