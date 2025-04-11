
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';
import { toast } from '@/components/ui/use-toast';
import { 
  setupCesiumOfflineMode,
  createOfflineCesiumViewerOptions,
  configureOfflineViewer
} from '@/utils/cesium-offline-mode';
import { setDefaultCameraView } from '@/utils/cesium-camera-utils';

interface UseCesiumMapResult {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  entityRef: React.MutableRefObject<Cesium.Entity | null>;
  isLoadingMap: boolean;
  mapError: string | null;
  isInitialized: boolean;
}

export const useCesiumMap = (
  cesiumContainer: React.RefObject<HTMLDivElement>,
  onMapReady?: () => void
): UseCesiumMapResult => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttempts = useRef(0);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
      for (let i = 0; i < 10; i++) {
        viewer.scene.requestRender();
      }
      
      // Save the viewer reference
      viewerRef.current = viewer;
      
      console.log("Cesium map initialized in offline mode");
      
      // Ensure globe is rendered before signaling ready
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      renderTimeoutRef.current = setTimeout(() => {
        // Force additional renders after a delay
        if (viewer && !viewer.isDestroyed()) {
          for (let i = 0; i < 5; i++) {
            viewer.scene.requestRender();
          }
          
          setIsInitialized(true);
          setIsLoadingMap(false);
          
          if (onMapReady) {
            onMapReady();
          }
        }
      }, 500);
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
      destroyViewer();
    };
  }, [cesiumContainer]);

  return {
    viewerRef,
    entityRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
