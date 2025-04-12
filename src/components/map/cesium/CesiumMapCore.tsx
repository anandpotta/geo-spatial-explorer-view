
import React, { useState, useRef } from 'react';
import * as Cesium from 'cesium';
import { useCesiumGlobeVisibility } from './hooks/useCesiumGlobeVisibility';
import CesiumViewer from './CesiumViewer';
import CesiumLocationHandler from './CesiumLocationHandler';
import { Location } from '@/utils/geo-utils';

interface CesiumMapCoreProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
}

/**
 * Core Cesium Map component that handles viewer and entity management
 */
const CesiumMapCore: React.FC<CesiumMapCoreProps> = ({ 
  selectedLocation, 
  onMapReady, 
  onFlyComplete, 
  cinematicFlight = true,
  onViewerReady
}) => {
  const [isFlying, setIsFlying] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);
  
  // Handle viewer being ready
  const handleViewerReady = (viewer: Cesium.Viewer) => {
    viewerRef.current = viewer;
    setViewerReady(true);
    if (onViewerReady) {
      onViewerReady(viewer);
    }

    // Force multiple renders to ensure the globe is visible
    for (let i = 0; i < 40; i++) {
      viewer.scene.requestRender();
    }
  };

  // Use the globe visibility hook
  useCesiumGlobeVisibility(viewerRef, viewerReady);

  // Handle fly operations start/end
  const handleFlyComplete = () => {
    setIsFlying(false);
    if (onFlyComplete) {
      onFlyComplete();
    }
  };
  
  return (
    <>
      <CesiumViewer
        isFlying={isFlying}
        onViewerReady={handleViewerReady}
        onMapReady={onMapReady}
      />
      
      {viewerReady && viewerRef.current && (
        <CesiumLocationHandler
          viewer={viewerRef.current}
          selectedLocation={selectedLocation}
          entityRef={entityRef}
          isInitialized={viewerReady}
          onFlyComplete={handleFlyComplete}
          cinematicFlight={cinematicFlight}
        />
      )}
    </>
  );
};

export default CesiumMapCore;
