
import { useRef } from 'react';
import CesiumMapLoading from '@/components/map/CesiumMapLoading';
import { useCesiumMap } from '@/hooks/cesium';
import CesiumContainer from './CesiumContainer';
import { useCesiumAutoRotation } from './hooks/useCesiumAutoRotation';
import { useCesiumCanvasVisibility } from './hooks/useCesiumCanvasVisibility';
import { useForceRenderCycles } from './hooks/useForceRenderCycles';
import { useViewerReadyEffect } from './hooks/useViewerReadyEffect';

interface CesiumViewerProps {
  isFlying: boolean;
  onViewerReady?: (viewer: any) => void;
  onMapReady?: () => void;
}

const CesiumViewer = ({ isFlying, onViewerReady, onMapReady }: CesiumViewerProps) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  // Use the Cesium map hook - fixed to match the current implementation in hooks/cesium/index.ts
  const { 
    viewerRef, 
    entityRef, 
    isLoadingMap, 
    mapError,
    isInitialized
  } = useCesiumMap();

  // Call onMapReady when initialized
  if (isInitialized && !hasInitializedRef.current && onMapReady) {
    onMapReady();
    hasInitializedRef.current = true;
  }
  
  // Initialize custom hooks
  useCesiumAutoRotation(isInitialized, viewerRef, isFlying);
  useCesiumCanvasVisibility(cesiumContainer);
  const renderIntervalRef = useForceRenderCycles(isInitialized, viewerRef);
  useViewerReadyEffect(viewerRef, isInitialized, onViewerReady);
  
  return (
    <>
      <CesiumMapLoading isLoading={isLoadingMap} mapError={mapError} />
      <CesiumContainer containerRef={cesiumContainer} />
    </>
  );
};

export default CesiumViewer;
