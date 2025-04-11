
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { initializeCesiumViewer } from './viewer-initialization-hook';
import { cleanupTimeouts, destroyViewer } from './use-cesium-cleanup';

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

  useEffect(() => {
    // Initialize the viewer with a slight delay
    initTimeoutRef.current = setTimeout(() => {
      initializeCesiumViewer({
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
    }, 200);

    return () => {
      // Clean up on component unmount
      cleanupTimeouts(initTimeoutRef, renderTimeoutRef, checkRenderIntervalRef);
      destroyViewer(viewerRef);
    };
  }, [cesiumContainer, onMapReady]);

  return {
    viewerRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
