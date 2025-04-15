
import React, { useState, useRef, useEffect } from 'react';
import * as Cesium from 'cesium';
import { useCesiumGlobeVisibility } from './hooks/useCesiumGlobeVisibility';
import CesiumViewer from './CesiumViewer';
import CesiumLocationHandler from './CesiumLocationHandler';
import { Location } from '@/utils/location/types';
import { forceGlobeVisibility } from '@/utils/cesium-viewer';

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
    for (let i = 0; i < 100; i++) {
      viewer.scene.requestRender();
    }
    
    // Force immediate globe visibility
    forceGlobeVisibility(viewer);
    
    console.log("CesiumMapCore: Viewer is ready, forcing globe visibility");
  };

  // Use the globe visibility hook
  useCesiumGlobeVisibility(viewerRef, viewerReady);

  // Additional attempts to ensure globe visibility
  useEffect(() => {
    if (viewerRef.current && viewerReady) {
      // Add more aggressive visibility checks at various intervals
      const intervals = [50, 100, 200, 500, 1000, 2000, 3000, 4000, 5000];
      
      intervals.forEach(interval => {
        setTimeout(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            console.log(`Forcing globe visibility at ${interval}ms`);
            forceGlobeVisibility(viewerRef.current);
            
            // Set camera to better position to see the globe if not flying
            if (!isFlying) {
              viewerRef.current.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(0.0, 20.0, 10000000.0),
                orientation: {
                  heading: Cesium.Math.toRadians(0.0),
                  pitch: Cesium.Math.toRadians(-45.0),
                  roll: 0.0
                }
              });
            }
            
            // Force resize and render
            viewerRef.current.resize();
            for (let i = 0; i < 10; i++) {
              viewerRef.current.scene.requestRender();
            }
          }
        }, interval);
      });
    }
  }, [viewerReady, isFlying]);

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
