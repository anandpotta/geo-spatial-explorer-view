
import * as Cesium from 'cesium';
import { toast } from '@/components/ui/use-toast';
import { 
  setupCesiumOfflineMode,
  createOfflineCesiumViewerOptions,
  configureOfflineViewer
} from '@/utils/cesium-offline-mode';
import { setDefaultCameraView } from '@/utils/cesium-camera-utils';
import { destroyViewer } from './use-cesium-cleanup';

export interface ViewerInitializationOptions {
  cesiumContainer: React.RefObject<HTMLDivElement>;
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  initializationAttempts: React.MutableRefObject<number>;
  initTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  checkRenderIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  renderTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setIsInitialized: (value: boolean) => void;
  setIsLoadingMap: (value: boolean) => void;
  setMapError: (value: string | null) => void;
  onMapReady?: () => void;
}

/**
 * Initializes the Cesium viewer
 */
export function initializeViewer({
  cesiumContainer,
  viewerRef,
  initializationAttempts,
  initTimeoutRef,
  checkRenderIntervalRef,
  renderTimeoutRef,
  setIsInitialized,
  setIsLoadingMap,
  setMapError,
  onMapReady
}: ViewerInitializationOptions): void {
  if (!cesiumContainer.current) {
    console.log("No container element available for Cesium viewer");
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    initTimeoutRef.current = setTimeout(() => initializeViewer({
      cesiumContainer,
      viewerRef,
      initializationAttempts,
      initTimeoutRef,
      checkRenderIntervalRef,
      renderTimeoutRef,
      setIsInitialized,
      setIsLoadingMap,
      setMapError,
      onMapReady
    }), 200);
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
      cesiumContainer.current.style.minHeight = '400px';
      cesiumContainer.current.style.display = 'block';
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
    for (let i = 0; i < 15; i++) {
      viewer.scene.requestRender();
    }
    
    // Save the viewer reference
    viewerRef.current = viewer;
    
    console.log("Cesium map initialized in offline mode");
    
    setupRenderChecks({
      viewer,
      viewerRef,
      checkRenderIntervalRef,
      renderTimeoutRef,
      setIsInitialized,
      setIsLoadingMap,
      onMapReady
    });
    
  } catch (error) {
    console.error('Error initializing Cesium viewer:', error);
    initializationAttempts.current += 1;
    
    if (initializationAttempts.current >= 3) {
      setMapError('Failed to initialize 3D globe. Please try again later.');
      setIsLoadingMap(false);
      
      toast({
        title: "Map Error",
        description: "Failed to initialize 3D globe. Falling back to 2D view.",
        variant: "destructive"
      });
    } else {
      // Try again with a slight delay
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      initTimeoutRef.current = setTimeout(() => {
        setIsLoadingMap(true);
        initializeViewer({
          cesiumContainer,
          viewerRef,
          initializationAttempts,
          initTimeoutRef,
          checkRenderIntervalRef,
          renderTimeoutRef,
          setIsInitialized,
          setIsLoadingMap,
          setMapError,
          onMapReady
        });
      }, 1000);
    }
  }
}

interface RenderCheckOptions {
  viewer: Cesium.Viewer;
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  checkRenderIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  renderTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setIsInitialized: (value: boolean) => void;
  setIsLoadingMap: (value: boolean) => void;
  onMapReady?: () => void;
}

/**
 * Sets up render checking to ensure the globe is visible
 */
function setupRenderChecks({
  viewer,
  viewerRef,
  checkRenderIntervalRef,
  renderTimeoutRef,
  setIsInitialized,
  setIsLoadingMap,
  onMapReady
}: RenderCheckOptions): void {
  // Start checking if the canvas is properly rendered
  if (checkRenderIntervalRef.current) {
    clearInterval(checkRenderIntervalRef.current);
  }
  
  checkRenderIntervalRef.current = setInterval(() => {
    if (viewer && !viewer.isDestroyed()) {
      const canvas = viewer.canvas;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        console.log(`Canvas rendering confirmed: ${canvas.width}x${canvas.height}`);
        
        // Clear the interval once we've confirmed rendering
        if (checkRenderIntervalRef.current) {
          clearInterval(checkRenderIntervalRef.current);
        }
        
        // Force resize to ensure dimensions are correct
        viewer.resize();
        
        // Force additional renders
        for (let i = 0; i < 10; i++) {
          viewer.scene.requestRender();
        }
        
        // Set initialized state after a delay
        setTimeout(() => {
          setIsInitialized(true);
          setIsLoadingMap(false);
          
          if (onMapReady) {
            onMapReady();
          }
        }, 300);
      }
    } else {
      if (checkRenderIntervalRef.current) {
        clearInterval(checkRenderIntervalRef.current);
      }
    }
  }, 100);
  
  // Ensure globe is rendered before signaling ready with a fallback timeout
  if (renderTimeoutRef.current) {
    clearTimeout(renderTimeoutRef.current);
  }
  
  renderTimeoutRef.current = setTimeout(() => {
    // Force additional renders after a delay
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      for (let i = 0; i < 10; i++) {
        viewerRef.current.scene.requestRender();
      }
      
      // Even if we didn't detect canvas rendering, proceed after timeout
      setIsInitialized(true);
      setIsLoadingMap(false);
      
      if (onMapReady) {
        onMapReady();
      }
    }
  }, 1500); // Longer timeout as fallback
}
