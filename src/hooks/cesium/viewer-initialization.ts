
import * as Cesium from 'cesium';
import { toast } from '@/components/ui/use-toast';
import { 
  setupCesiumOfflineMode,
  createOfflineCesiumViewerOptions,
  configureOfflineViewer
} from '@/utils/cesium-offline-mode';
import { setDefaultCameraView } from '@/utils/cesium-camera';
import { destroyViewer } from './use-cesium-cleanup';
import { setupRenderChecks } from './render-check';
import { handleInitializationError } from './handle-initialization-error';
import { ViewerInitializationOptions } from './initialization-types';
import { forceGlobeVisibility } from '@/utils/cesium-viewer';

/**
 * Checks if WebGL is available in the current browser
 */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/**
 * Initializes the Cesium viewer
 */
export function initializeViewer(options: ViewerInitializationOptions): void {
  const {
    cesiumContainer,
    viewerRef,
    initTimeoutRef,
    setIsInitialized,
    setIsLoadingMap,
    setMapError,
    onMapReady
  } = options;

  // Check for WebGL support first
  if (!isWebGLAvailable()) {
    console.error("WebGL is not available in this browser");
    setMapError("WebGL is not supported in your browser. Please try a different browser or update your graphics drivers.");
    setIsLoadingMap(false);
    
    toast({
      title: "WebGL Error",
      description: "Your browser doesn't support WebGL, which is required for the 3D globe. Falling back to 2D map view.",
      variant: "destructive"
    });
    return;
  }

  if (!cesiumContainer.current) {
    console.log("No container element available for Cesium viewer");
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    initTimeoutRef.current = setTimeout(() => initializeViewer(options), 200);
    return;
  }
  
  destroyViewer(viewerRef);

  try {
    console.log("Initializing Cesium viewer in offline mode...");
    
    // Force container dimensions if needed
    if (cesiumContainer.current.clientWidth === 0 || cesiumContainer.current.clientHeight === 0) {
      console.warn("Container has zero width/height, forcing dimensions");
      cesiumContainer.current.style.width = '100%';
      cesiumContainer.current.style.height = '100%';
      cesiumContainer.current.style.minHeight = '500px';
      cesiumContainer.current.style.display = 'block';
      cesiumContainer.current.style.background = 'black';
      
      // Reflow the layout
      cesiumContainer.current.offsetHeight;
    }
    
    // Setup for offline mode
    setupCesiumOfflineMode();
    
    // Create the viewer with offline options
    const viewerOptions = createOfflineCesiumViewerOptions();
    
    // Add debug information to see if viewer creation is working
    console.log("Creating Cesium viewer with container dimensions:", 
      cesiumContainer.current.clientWidth, 
      cesiumContainer.current.clientHeight);
    
    // Create viewer with minimal features to avoid errors
    viewerOptions.skyAtmosphere = false; // Disable problematic skyAtmosphere 
    viewerOptions.terrainProvider = undefined; // Disable terrain
    viewerOptions.skyBox = false; // Disable skybox
    viewerOptions.globe = new Cesium.Globe(Cesium.Ellipsoid.WGS84); // Create a valid Globe object instead of boolean
    viewerOptions.sceneMode = Cesium.SceneMode.SCENE3D; // Use 3D mode
    
    // Set WebGL options for maximum compatibility
    if (!viewerOptions.contextOptions) {
      viewerOptions.contextOptions = {
        webgl: {
          alpha: false,
          antialias: true,
          powerPreference: 'default', // Use default instead of high-performance for compatibility
          failIfMajorPerformanceCaveat: false, // Don't fail on performance issues
          preserveDrawingBuffer: true
        }
      };
    }
    
    // Create viewer with error handling
    try {
      const viewer = new Cesium.Viewer(cesiumContainer.current, viewerOptions);
      viewerRef.current = viewer;
      
      console.log("Cesium viewer created successfully");
      
      // Configure for offline mode with safe settings
      try {
        configureOfflineViewer(viewer);
      } catch (e) {
        console.warn("Error during offline configuration:", e);
      }
      
      // Set initial earth view
      try {
        setDefaultCameraView(viewer);
      } catch (e) {
        console.warn("Error setting default camera view:", e);
      }

      // Force a manual camera setup if needed
      if (viewer.camera) {
        // Set a safe initial position manually
        viewer.camera.position = new Cesium.Cartesian3(0, 0, 20000000);
        
        // Create direction vector safely
        const direction = new Cesium.Cartesian3(0, 0, -1);
        const up = new Cesium.Cartesian3(0, 1, 0);
        
        // Set camera direction and up without normalization (we're using unit vectors)
        viewer.camera.direction = direction;
        viewer.camera.up = up;
        
        // Manually compute right vector without normalization
        viewer.camera.right = new Cesium.Cartesian3(1, 0, 0);
      }

      // Force multiple render cycles to ensure the globe is visible
      for (let i = 0; i < 5; i++) {
        try {
          viewer.scene.requestRender();
        } catch (e) {
          console.warn("Render error caught:", e);
        }
      }
      
      console.log("Cesium map initialized in offline mode");
      
      // Enable animation
      viewer.clock.shouldAnimate = true;
      
      // Force globe visibility
      try {
        forceGlobeVisibility(viewer);
      } catch (e) {
        console.warn("Error forcing globe visibility:", e);
      }
      
      setupRenderChecks({
        viewer,
        viewerRef,
        checkRenderIntervalRef: options.checkRenderIntervalRef,
        renderTimeoutRef: options.renderTimeoutRef,
        setIsInitialized,
        setIsLoadingMap,
        onMapReady
      });
    } catch (viewerError) {
      console.error("Error creating viewer:", viewerError);
      handleInitializationError(viewerError, options);
    }
  } catch (setupError) {
    console.error("Error during initialization setup:", setupError);
    handleInitializationError(setupError, options);
  }
}
