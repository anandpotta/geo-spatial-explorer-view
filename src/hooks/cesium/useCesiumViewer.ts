
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { toast } from '@/components/ui/use-toast';
import { 
  setupCesiumOfflineMode,
  createOfflineCesiumViewerOptions,
  configureOfflineViewer
} from '@/utils/cesium-offline-mode';
import { setDefaultCameraView } from '@/utils/cesium-camera-utils';

interface UseCesiumViewerResult {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  isLoadingMap: boolean;
  mapError: string | null;
  isInitialized: boolean;
}

/**
 * Hook for managing Cesium viewer initialization and lifecycle
 */
export const useCesiumViewer = (
  cesiumContainer: React.RefObject<HTMLDivElement>,
  onMapReady?: () => void
): UseCesiumViewerResult => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttempts = useRef(0);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkRenderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up function to destroy the viewer safely
  const destroyViewer = () => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      console.log("Destroying previous Cesium viewer");
      try {
        viewerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying viewer:", e);
      }
      viewerRef.current = null;
    }
  };

  // Check if we have a valid container and viewer
  const checkViewerStatus = () => {
    if (viewerRef.current && !viewerRef.current.isDestroyed() && cesiumContainer.current) {
      return true;
    }
    return false;
  };

  // Initialize the Cesium viewer
  const initializeViewer = () => {
    if (!cesiumContainer.current) {
      console.log("No container element available for Cesium viewer");
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      initTimeoutRef.current = setTimeout(initializeViewer, 200);
      return;
    }
    
    destroyViewer();

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
        if (viewer && !viewer.isDestroyed()) {
          for (let i = 0; i < 10; i++) {
            viewer.scene.requestRender();
          }
          
          // Even if we didn't detect canvas rendering, proceed after timeout
          if (!isInitialized) {
            setIsInitialized(true);
            setIsLoadingMap(false);
            
            if (onMapReady) {
              onMapReady();
            }
          }
        }
      }, 1500); // Longer timeout as fallback
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
          initializeViewer();
        }, 1000);
      }
    }
  };

  useEffect(() => {
    // Give the container a moment to be fully rendered before initializing
    initTimeoutRef.current = setTimeout(initializeViewer, 200);

    return () => {
      // Clean up on component unmount
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (checkRenderIntervalRef.current) {
        clearInterval(checkRenderIntervalRef.current);
      }
      destroyViewer();
    };
  }, [cesiumContainer]);

  return {
    viewerRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
