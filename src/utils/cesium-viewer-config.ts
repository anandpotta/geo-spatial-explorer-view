
import * as Cesium from 'cesium';

/**
 * Creates minimal viewer options for offline Cesium usage
 */
export function createOfflineCesiumViewerOptions(): Cesium.Viewer.ConstructorOptions {
  // Create a simple grid imagery provider with proper parameters
  const gridImageryProvider = new Cesium.GridImageryProvider({
    cells: 2,
    color: Cesium.Color.BLUE,
    glowColor: Cesium.Color.BLUE.withAlpha(0.1),
    backgroundColor: Cesium.Color.BLACK
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
    // Use the correct property name for the imagery provider based on Cesium's type definitions
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(Promise.resolve(gridImageryProvider)),
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    targetFrameRate: 30, // Increased for smoother rotation
    shadows: false,
    skyBox: false as any, // Disable skybox
    skyAtmosphere: false as any, // Disable atmosphere
    globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84),
    scene3DOnly: true, // Optimize for 3D only
    shouldAnimate: true // Ensure the globe is animating
  };
}

/**
 * Configures a Cesium viewer for offline mode by disabling all network-dependent features
 */
export function configureOfflineViewer(viewer: Cesium.Viewer): void {
  if (!viewer) {
    console.warn('Invalid viewer object provided to configureOfflineViewer');
    return;
  }
  
  try {
    // 1. Configure globe appearance 
    if (viewer.scene && viewer.scene.globe) {
      const globe = viewer.scene.globe;
      // Disable all globe features that might request data
      globe.enableLighting = false;
      globe.showWaterEffect = false;
      globe.showGroundAtmosphere = false;
      globe.baseColor = Cesium.Color.BLUE.withAlpha(0.7); // Simple blue globe
      
      // Disable terrain
      globe.depthTestAgainstTerrain = false;
    }
    
    // 2. Disable all automatic asset loading features - with safety checks
    if (viewer.scene) {
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = false;
      }
      
      if (viewer.scene.fog) {
        viewer.scene.fog.enabled = false;
      }
      
      if (viewer.scene.moon) {
        viewer.scene.moon.show = false;
      }
      
      if (viewer.scene.sun) {
        viewer.scene.sun.show = false;
      }
      
      if (viewer.scene.skyBox) {
        viewer.scene.skyBox.show = false;
      }
      
      // 3. Set background color
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      
      // 4. Use type assertion to access private properties safely
      try {
        if (viewer.scene.globe) {
          // Access private properties using type assertion
          const globeAny = viewer.scene.globe as any;
          if (globeAny && globeAny._surface && globeAny._surface._tileProvider) {
            if (globeAny._surface._tileProvider._debug) {
              globeAny._surface._tileProvider._debug.wireframe = true;
            }
          }
        }
      } catch (e) {
        console.log('Could not access internal globe properties, continuing anyway');
      }
    }
  } catch (e) {
    console.error('Error configuring offline viewer:', e);
  }
}
