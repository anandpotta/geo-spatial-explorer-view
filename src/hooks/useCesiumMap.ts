
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';
import { toast } from '@/components/ui/use-toast';
import { 
  patchCesiumToPreventNetworkRequests, 
  createOfflineCesiumViewerOptions,
  configureOfflineViewer
} from '@/utils/cesium-patch-utils';
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

  // Initialize Cesium viewer
  useEffect(() => {
    // Check if container is available
    if (!cesiumContainer.current) {
      console.log("No container element available for Cesium viewer");
      return;
    }

    // Wait a moment to ensure DOM is fully rendered
    const initTimeout = setTimeout(() => {
      // Clean up any previous viewer
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
        
        // Check container dimensions
        if (cesiumContainer.current.clientWidth === 0 || cesiumContainer.current.clientHeight === 0) {
          console.warn("Container has zero width/height, forcing dimensions");
          cesiumContainer.current.style.width = '100%';
          cesiumContainer.current.style.height = '100%';
          cesiumContainer.current.style.minHeight = '400px';
        }
        
        // 1. Disable Ion completely
        Cesium.Ion.defaultAccessToken = '';
        
        // 2. Use our patching mechanism to prevent network requests
        patchCesiumToPreventNetworkRequests();
        
        // 3. Create viewer with offline configuration
        const viewerOptions = createOfflineCesiumViewerOptions();
        
        // Creating the viewer
        const viewer = new Cesium.Viewer(cesiumContainer.current, viewerOptions);
        
        // 4. Configure viewer for offline mode
        configureOfflineViewer(viewer);
        
        // 5. Set initial camera view
        setDefaultCameraView(viewer);
        
        // 6. Save the viewer reference
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
        
        // After multiple attempts, give up and show error
        if (initializationAttempts.current >= 3) {
          setMapError('Failed to initialize 3D globe. Please try again later.');
          setIsLoadingMap(false);
          
          // Show error toast
          toast({
            title: "Map Error",
            description: "Failed to initialize 3D globe. Falling back to 2D view.",
            variant: "destructive"
          });
        } else {
          // Try again after a short delay
          setTimeout(() => {
            setIsLoadingMap(true);
          }, 1000);
        }
      }
    }, 300); // Give the DOM more time to render
    
    // Clean up on unmount
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
