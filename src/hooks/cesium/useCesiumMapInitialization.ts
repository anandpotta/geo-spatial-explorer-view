
import { useEffect } from 'react';
import * as Cesium from 'cesium';

/**
 * Hook to handle initialization side effects for the Cesium map
 * Separated from useCesiumMap to focus on initialization concerns
 */
export const useCesiumMapInitialization = (
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>,
  isInitialized: boolean
): void => {
  // Effect to handle any initialization logic for the map
  useEffect(() => {
    if (isInitialized && viewerRef.current && !viewerRef.current.isDestroyed()) {
      // Force the scene to render multiple times to ensure the globe is visible
      const viewer = viewerRef.current;
      
      // Once map is initialized, ensure globe is visible with multiple renders
      for (let i = 0; i < 20; i++) {
        viewer.scene.requestRender();
      }
      
      // Set up any initial camera settings or viewer behaviors
      if (viewer.camera) {
        // Enable smooth camera transitions
        (viewer.camera as any).defaultZoomAmount = 100000;
      }
      
      // Ensure the globe is properly displayed
      if (viewer.scene && viewer.scene.globe) {
        viewer.scene.globe.show = true;
        viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
      }
      
      // Request one more render after initialization
      viewer.scene.requestRender();
    }
  }, [isInitialized, viewerRef]);
};
