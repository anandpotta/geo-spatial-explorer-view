
import { useRef } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import CesiumMapLoading from '@/components/map/CesiumMapLoading';
import { useCesiumMap } from '@/hooks/cesium';
import CesiumContainer from './CesiumContainer';
import { useCesiumAutoRotation } from './hooks/useCesiumAutoRotation';
import { useCesiumCanvasVisibility } from './hooks/useCesiumCanvasVisibility';
import { useForceRenderCycles } from './hooks/useForceRenderCycles';
import { useViewerReadyEffect } from './hooks/useViewerReadyEffect';

interface CesiumViewerProps {
  isFlying: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
  onMapReady?: () => void;
}

const CesiumViewer = ({ isFlying, onViewerReady, onMapReady }: CesiumViewerProps) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  // Use the Cesium map hook
  const { 
    viewerRef, 
    entityRef, 
    isLoadingMap, 
    mapError,
    isInitialized
  } = useCesiumMap(cesiumContainer, () => {
    if (onMapReady) {
      onMapReady();
    }
    
    // Mark as initialized
    hasInitializedRef.current = true;
    
    console.log("CesiumViewer: Map ready callback executed");
  });

  // Initialize custom hooks
  useCesiumAutoRotation(isInitialized, viewerRef, isFlying);
  useCesiumCanvasVisibility(cesiumContainer);
  const renderIntervalRef = useForceRenderCycles(isInitialized, viewerRef);
  useViewerReadyEffect(viewerRef, isInitialized, onViewerReady);
  
  // Add a console log to verify rendering
  console.log("CesiumViewer rendering, initialized:", isInitialized, "loading:", isLoadingMap);
  
  return (
    <>
      <CesiumMapLoading isLoading={isLoadingMap} mapError={mapError} />
      <CesiumContainer containerRef={cesiumContainer} />
    </>
  );
};

export default CesiumViewer;
