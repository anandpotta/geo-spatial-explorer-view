
import * as Cesium from 'cesium';

/**
 * Creates minimal viewer options for offline Cesium usage
 */
export function createOfflineCesiumViewerOptions(): Cesium.Viewer.ConstructorOptions {
  // Create a simple grid imagery provider with more visible parameters
  const gridImageryProvider = new Cesium.GridImageryProvider({
    cells: 2,  // Smaller cells for more visible grid
    color: Cesium.Color.CORNFLOWERBLUE.withAlpha(0.8),
    glowColor: Cesium.Color.WHITE.withAlpha(0.4),
    backgroundColor: Cesium.Color.DARKBLUE.withAlpha(0.7)
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
    requestRenderMode: false,  // Changed to false to ensure continuous rendering initially
    maximumRenderTimeChange: Infinity,
    targetFrameRate: 60, // Increased for smoother rotation
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
      // Make the globe more visible with enhanced appearance
      globe.enableLighting = false;
      globe.showWaterEffect = false;
      globe.showGroundAtmosphere = false;
      globe.baseColor = Cesium.Color.CORNFLOWERBLUE.withAlpha(0.9); // More opaque blue globe
      globe.translucency.enabled = false;
      
      // Disable terrain
      globe.depthTestAgainstTerrain = false;
      
      // Make sure the globe is visible
      globe.show = true;
    }
    
    // 2. Disable all automatic asset loading features - with safety checks
    if (viewer.scene) {
      // Disable atmospheric effects which might cause errors
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
      
      // Fix: Use hasOwnProperty check before accessing 'enabled' property on postProcessStages
      if (viewer.scene.postProcessStages) {
        // Check if the appropriate method exists instead of directly setting the property
        if (typeof viewer.scene.postProcessStages.removeAll === 'function') {
          viewer.scene.postProcessStages.removeAll();
        }
        // Or alternatively, just leave it alone and don't try to disable it
      }
      
      // Set background color
      viewer.scene.backgroundColor = Cesium.Color.BLACK;

      // Disable sun/moon lighting calculations which may trigger network requests
      if ((viewer.scene as any)._environmentState) {
        (viewer.scene as any)._environmentState.isSunVisible = false;
        (viewer.scene as any)._environmentState.isMoonVisible = false;
      }
      
      // Force multiple render cycles to ensure the globe appears
      for (let i = 0; i < 5; i++) {
        viewer.scene.requestRender();
      }
    }
    
    // 3. Force the globe to be visible
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
    }

    // 4. Make sure we're in 3D mode
    if (viewer.scene) {
      viewer.scene.mode = Cesium.SceneMode.SCENE3D;
      
      // Add camera control to prevent issues with initial view
      if (viewer.scene.screenSpaceCameraController) {
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        viewer.scene.screenSpaceCameraController.enableTranslate = true;
        viewer.scene.screenSpaceCameraController.enableZoom = true;
        viewer.scene.screenSpaceCameraController.enableTilt = true;
        viewer.scene.screenSpaceCameraController.enableLook = true;
      }
    }
    
    // 5. Disable frame rate throttling to ensure continuous rendering
    viewer.targetFrameRate = 60;
    viewer.useDefaultRenderLoop = true;
  } catch (e) {
    console.error('Error configuring offline viewer:', e);
  }
}
