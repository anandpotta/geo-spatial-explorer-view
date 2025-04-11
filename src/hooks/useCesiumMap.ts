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

  useEffect(() => {
    if (!cesiumContainer.current) {
      console.log("No container element available for Cesium viewer");
      return;
    }

    // Ensure we're not re-initializing too quickly
    const initTimeout = setTimeout(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        console.log("Destroying previous Cesium viewer");
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying viewer:", e);
        }
        viewerRef.current = null;
      }

      try {
        console.log("Initializing Cesium viewer in offline mode...");
        
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
        
        // Force a render cycle
        viewer.scene.requestRender();
        
        // Save the viewer reference
        viewerRef.current = viewer;
        
        console.log("Cesium map initialized in offline mode");
        setIsInitialized(true);
        setIsLoadingMap(false);
        
        if (onMapReady) {
          onMapReady();
        }
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
          setTimeout(() => {
            setIsLoadingMap(true);
          }, 1000);
        }
      }
    }, 300);

    return () => {
      clearTimeout(initTimeout);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        console.log("Destroying Cesium viewer on unmount");
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying viewer:", e);
        }
      }
    };
  }, [cesiumContainer, onMapReady, isLoadingMap]);

  return {
    viewerRef,
    entityRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
