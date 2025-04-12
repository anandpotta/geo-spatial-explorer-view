
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
  const forceRenderRef = useRef<NodeJS.Timeout | null>(null);
  
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
    
    // Set a continuous render cycle to ensure globe visibility
    if (forceRenderRef.current) {
      clearInterval(forceRenderRef.current);
    }
    
    forceRenderRef.current = setInterval(() => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.requestRender();
        
        // Ensure globe is visible
        if (viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.show = true;
          viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
        }
      } else {
        if (forceRenderRef.current) {
          clearInterval(forceRenderRef.current);
        }
      }
    }, 100);
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
      const renderTimes = [100, 300, 500, 1000, 2000, 3000, 5000];
      renderTimes.forEach(time => {
        setTimeout(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.scene.requestRender();
            
            // Ensure the globe is visible with bright color
            if (viewerRef.current.scene && viewerRef.current.scene.globe) {
              viewerRef.current.scene.globe.show = true;
              viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
            }
            
            // Ensure canvas is visible
            if (viewerRef.current.canvas) {
              viewerRef.current.canvas.style.visibility = 'visible';
              viewerRef.current.canvas.style.display = 'block';
              viewerRef.current.canvas.style.opacity = '1';
            }
          }
        }, time);
      });
    }
    
    return () => {
      if (forceRenderRef.current) {
        clearInterval(forceRenderRef.current);
      }
    };
  }, [viewerReady]);
  
  return (
    <div className="w-full h-full relative" style={{ zIndex: 999, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'black' }}>
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
