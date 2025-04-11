
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

  // Initialize Cesium viewer
  useEffect(() => {
    // Check if container is available
    if (!cesiumContainer.current) {
      console.log("No container element available for Cesium viewer");
      return;
    }

    // Wait a brief moment to ensure DOM is fully rendered
    const initTimeout = setTimeout(() => {
      // Clean up any previous viewer
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        console.log("Destroying previous Cesium viewer");
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      try {
        console.log("Initializing Cesium viewer in offline mode...");
        
        // 1. Disable Ion completely
        Cesium.Ion.defaultAccessToken = '';
        
        // 2. Use our patching mechanism to prevent network requests
        patchCesiumToPreventNetworkRequests();
        
        // Verify container dimensions
        if (cesiumContainer.current.clientWidth === 0 || cesiumContainer.current.clientHeight === 0) {
          console.warn("Container has zero width/height, Cesium may fail to initialize properly");
        }
        
        // 3. Create viewer with offline configuration
        const viewerOptions = createOfflineCesiumViewerOptions();
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
        setMapError('Failed to initialize 3D globe. Please try again later.');
        setIsLoadingMap(false);
        
        // Show error toast
        toast({
          title: "Map Error",
          description: "Failed to initialize 3D globe. Falling back to 2D view.",
          variant: "destructive"
        });
      }
    }, 100); // Give the DOM a moment to render
    
    // Clean up on unmount
    return () => {
      clearTimeout(initTimeout);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        console.log("Destroying Cesium viewer on unmount");
        viewerRef.current.destroy();
      }
    };
  }, [cesiumContainer, onMapReady]);

  return {
    viewerRef,
    entityRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
