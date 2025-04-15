
import React, { useState, useRef, useEffect } from 'react';
import * as Cesium from 'cesium';
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
  // All state declarations must be at the top level and same order on every render
  const [isFlying, setIsFlying] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  
  // All refs must be declared before any conditional logic
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
    if (viewer && !viewer.isDestroyed()) {
      for (let i = 0; i < 50; i++) {
        viewer.scene.requestRender();
      }
      
      // Force immediate globe visibility
      forceGlobeVisibility(viewer);
      
      console.log("CesiumMapCore: Viewer is ready, forcing globe visibility");
    }
  };

  // Handle fly operations start/end
  const handleFlyComplete = () => {
    setIsFlying(false);
    if (onFlyComplete) {
      onFlyComplete();
    }
  };

  // Ensure consistent globe visibility - always declare this effect, never conditionally
  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      // Force multiple renders
      for (let i = 0; i < 25; i++) {
        viewerRef.current.scene.requestRender();
      }
      
      // Force globe visibility at key intervals
      const intervals = [100, 500, 1000, 2000, 3000];
      
      intervals.forEach(interval => {
        const timeout = setTimeout(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            console.log(`Forcing globe visibility at ${interval}ms`);
            forceGlobeVisibility(viewerRef.current);
            
            // Resize viewer and force renders
            viewerRef.current.resize();
            for (let i = 0; i < 5; i++) {
              viewerRef.current.scene.requestRender();
            }
          }
        }, interval);
        
        return () => clearTimeout(timeout);
      });
    }
  }, [viewerReady]);
  
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
