
import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { forceGlobeVisibility } from '@/utils/cesium-viewer';

/**
 * Hook to handle viewer ready state and callbacks
 */
export const useViewerReadyEffect = (
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>,
  isInitialized: boolean,
  onViewerReady?: (viewer: Cesium.Viewer) => void
) => {
  // Pass the viewer reference to parent when available
  useEffect(() => {
    if (viewerRef.current && onViewerReady && isInitialized) {
      onViewerReady(viewerRef.current);
      
      // Force globe visibility when passing viewer reference
      forceGlobeVisibility(viewerRef.current);
      
      // Force resize to ensure proper dimensions
      viewerRef.current.resize();
      
      console.log('Viewer ready and passed to parent, canvas: ', 
        viewerRef.current.canvas ? 
        `${viewerRef.current.canvas.width}x${viewerRef.current.canvas.height}` : 
        'no canvas');
    }
  }, [isInitialized, onViewerReady, viewerRef]);
};
