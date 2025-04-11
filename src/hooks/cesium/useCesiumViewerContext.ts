
import { useRef } from 'react';
import * as Cesium from 'cesium';

/**
 * Hook for managing Cesium viewer context across components
 */
export function useCesiumViewerContext() {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);

  return {
    viewerRef,
    entityRef,
    setViewer: (viewer: Cesium.Viewer | null) => {
      viewerRef.current = viewer;
    }
  };
}
