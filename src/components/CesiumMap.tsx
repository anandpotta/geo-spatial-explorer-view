
import { useState, useRef, useEffect } from 'react';
import * as Cesium from 'cesium';
import { Location } from '@/utils/geo-utils';
import CesiumViewer from './map/cesium/CesiumViewer';
import CesiumLocationHandler from './map/cesium/CesiumLocationHandler';

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
}

const CesiumMap = ({ 
  selectedLocation, 
  onMapReady, 
  onFlyComplete, 
  cinematicFlight = true,
  onViewerReady
}: CesiumMapProps) => {
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
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
  };

  // Handle fly operations start/end
  const handleFlyComplete = () => {
    setIsFlying(false);
    if (onFlyComplete) {
      onFlyComplete();
    }
  };

  // Force renders periodically to ensure globe visibility
  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      const renderTimes = [100, 500, 1000, 2000];
      renderTimes.forEach(time => {
        setTimeout(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.scene.requestRender();
            
            // Ensure the globe is visible
            if (viewerRef.current.scene && viewerRef.current.scene.globe) {
              viewerRef.current.scene.globe.show = true;
            }
          }
        }, time);
      });
    }
  }, [viewerReady]);
  
  return (
    <div className="w-full h-full relative" style={{ zIndex: 30, position: 'relative', background: 'black' }}>
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
    </div>
  );
};

export default CesiumMap;
