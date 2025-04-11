
import * as Cesium from 'cesium';

/**
 * Creates minimal viewer options for offline Cesium usage
 */
export function createOfflineCesiumViewerOptions(): Cesium.Viewer.ConstructorOptions {
  // Create a simple grid imagery provider with more visible parameters
  const gridImageryProvider = new Cesium.GridImageryProvider({
    cells: 2,  // Smaller cells for more visible grid
    color: Cesium.Color.CORNFLOWERBLUE, // Full opacity
    glowColor: Cesium.Color.WHITE.withAlpha(0.6),
    backgroundColor: Cesium.Color.DARKBLUE.withAlpha(0.85)
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
    requestRenderMode: false,  // Always render continuously 
    maximumRenderTimeChange: Infinity,
    targetFrameRate: 60, // Higher framerate for smoother rotation
    shadows: false,
    skyBox: false as any, // Disable skybox
    skyAtmosphere: false as any, // Disable atmosphere
    globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84),
    scene3DOnly: true, // Optimize for 3D only
    shouldAnimate: true, // Ensure the globe is animating
    orderIndependentTranslucency: false // Disable OIT for better performance
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
      globe.baseColor = Cesium.Color.BLUE; // Fully opaque blue globe
      globe.translucency.enabled = false;
      
      // Disable terrain
      globe.depthTestAgainstTerrain = false;
      
      // Make sure the globe is visible
      globe.show = true;
      
      // Explicitly configure globe to be solid and visible
      (globe as any)._surface._tileProvider._debug.wireframe = false;
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
      }
      
      // Set background color
      viewer.scene.backgroundColor = Cesium.Color.BLACK;

      // Disable sun/moon lighting calculations which may trigger network requests
      if ((viewer.scene as any)._environmentState) {
        (viewer.scene as any)._environmentState.isSunVisible = false;
        (viewer.scene as any)._environmentState.isMoonVisible = false;
      }
      
      // Force multiple render cycles to ensure the globe appears
      for (let i = 0; i < 15; i++) {  // Increased render requests
        viewer.scene.requestRender();
      }
    }
    
    // 3. Force the globe to be visible with additional setup
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      
      // Request extra renders after a short delay
      setTimeout(() => {
        if (viewer && !viewer.isDestroyed()) {
          for (let i = 0; i < 10; i++) {
            viewer.scene.requestRender();
          }
          console.log('Additional renders requested to ensure globe visibility');
        }
      }, 200);
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
    
    // 6. Ensure canvas has proper dimensions
    if (viewer.canvas) {
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
      
      // Force resize to ensure proper dimensions
      setTimeout(() => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.resize();
          console.log('Viewer resized to ensure proper canvas dimensions');
        }
      }, 100);
    }
  } catch (e) {
    console.error('Error configuring offline viewer:', e);
  }
}
