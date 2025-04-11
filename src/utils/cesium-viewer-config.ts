import * as Cesium from 'cesium';

/**
 * Creates minimal viewer options for offline Cesium usage
 */
export function createOfflineCesiumViewerOptions(): Cesium.Viewer.ConstructorOptions {
  // Create a simple grid imagery provider with earth-like appearance
  const gridImageryProvider = new Cesium.GridImageryProvider({
    cells: 8,  // Larger cells for continent-like appearance
    color: Cesium.Color.WHITE.withAlpha(0.1), // Subtle grid lines
    glowColor: Cesium.Color.WHITE.withAlpha(0.2),
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
    skyAtmosphere: true, // Use boolean instead of creating an instance
    globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84),
    scene3DOnly: true, // Optimize for 3D only
    shouldAnimate: true, // Ensure the globe is animating
    orderIndependentTranslucency: true // Enable for better atmospheric effects
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
      
      // Make the globe blue like Earth
      globe.baseColor = Cesium.Color.BLUE.withAlpha(1.0);
      
      // Enable lighting for better 3D appearance
      globe.enableLighting = true;
      
      // Disable water effects which require network resources
      globe.showWaterEffect = false;
      
      // Enable atmosphere glow
      globe.showGroundAtmosphere = true;
      
      // Disable terrain depth testing which can interfere with flat globe
      globe.depthTestAgainstTerrain = false;
      
      // Make sure the globe is visible
      globe.show = true;
      
      // Explicitly configure globe to be solid
      try {
        (globe as any)._surface._tileProvider._debug.wireframe = false;
      } catch (e) {
        // Safely ignore if this property isn't available
      }
      
      // Set a dark space background
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
    }
    
    // 2. Configure atmosphere for the Earth glow effect
    if (viewer.scene && viewer.scene.skyAtmosphere) {
      // Check if skyAtmosphere is an object and not just a boolean
      if (typeof viewer.scene.skyAtmosphere === 'object') {
        // Only set properties if it's an object with properties
        if ('show' in viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = true;
        }
        if ('hueShift' in viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.hueShift = 0.0;
          viewer.scene.skyAtmosphere.saturationShift = 0.1;
          viewer.scene.skyAtmosphere.brightnessShift = 0.8;
        }
      }
    }
    
    // 3. Disable celestial bodies but keep atmosphere
    if (viewer.scene) {
      // Disable fog which can interfere with visibility
      if (viewer.scene.fog) {
        viewer.scene.fog.enabled = false;
      }
      
      // Hide moon
      if (viewer.scene.moon) {
        viewer.scene.moon.show = false;
      }
      
      // Hide sun but keep its lighting effects
      if (viewer.scene.sun) {
        viewer.scene.sun.show = false;
      }
      
      // Hide skybox stars
      if (viewer.scene.skyBox) {
        viewer.scene.skyBox.show = false;
      }
      
      // Remove post-processing which may rely on network resources
      if (viewer.scene.postProcessStages) {
        if (typeof viewer.scene.postProcessStages.removeAll === 'function') {
          viewer.scene.postProcessStages.removeAll();
        }
      }
      
      // Set camera control options for better navigation
      if (viewer.scene.screenSpaceCameraController) {
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        viewer.scene.screenSpaceCameraController.enableTranslate = true;
        viewer.scene.screenSpaceCameraController.enableZoom = true;
        viewer.scene.screenSpaceCameraController.enableTilt = true;
        viewer.scene.screenSpaceCameraController.enableLook = true;
      }
      
      // Force multiple render cycles to ensure the globe appears
      for (let i = 0; i < 15; i++) {
        viewer.scene.requestRender();
      }
    }
    
    // 4. Ensure canvas has proper dimensions
    if (viewer.canvas) {
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
      
      // Force resize to ensure proper dimensions
      setTimeout(() => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.resize();
          console.log('Viewer resized to ensure proper canvas dimensions');
          
          // Force additional renders after resize
          for (let i = 0; i < 10; i++) {
            viewer.scene.requestRender();
          }
        }
      }, 100);
    }
  } catch (e) {
    console.error('Error configuring offline viewer:', e);
  }
}
