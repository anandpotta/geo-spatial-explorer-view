
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { destroyViewer, cleanupTimeouts } from './use-cesium-cleanup';
import { initializeViewer } from './use-cesium-initialization';

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
    // Give the container a moment to be fully rendered before initializing
    initTimeoutRef.current = setTimeout(() => {
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
