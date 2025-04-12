
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
    
    const viewer = new Cesium.Viewer(cesiumContainer.current, viewerOptions);
    
    // Configure for offline mode
    configureOfflineViewer(viewer);
    
    // Set initial earth view
    setDefaultCameraView(viewer);

    // Force multiple render cycles to ensure the globe is visible
    for (let i = 0; i < 30; i++) { // Increased render cycles
      viewer.scene.requestRender();
    }
    
    // Save the viewer reference
    viewerRef.current = viewer;
    
    console.log("Cesium map initialized in offline mode");
    
    // Enable animation
    viewer.clock.shouldAnimate = true;
    
    // Request render again after a slight delay
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.resize();
        for (let i = 0; i < 10; i++) {
          viewer.scene.requestRender();
        }
      }
    }, 100);
    
    setupRenderChecks({
      viewer,
      viewerRef,
      checkRenderIntervalRef: options.checkRenderIntervalRef,
      renderTimeoutRef: options.renderTimeoutRef,
      setIsInitialized,
      setIsLoadingMap,
      onMapReady
    });
    
  } catch (error) {
    handleInitializationError(error, options);
  }
}
