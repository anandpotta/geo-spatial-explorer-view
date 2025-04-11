
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Location } from '@/utils/geo-utils';
import CesiumMapLoading from './map/CesiumMapLoading';
import { useCesiumMap } from '@/hooks/cesium';
import { flyToLocation } from '@/utils/cesium-utils';

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
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [isFlying, setIsFlying] = useState(false);
  const pendingLocationRef = useRef<Location | undefined>(selectedLocation);
  const [viewerReady, setViewerReady] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const forceRenderCount = useRef(0);
  
  // Use the extracted Cesium map hook
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
    
    // Add a delay to ensure the globe is rendered before considering it "ready"
    setTimeout(() => {
      setViewerReady(true);
      
      // After a short delay, make sure the canvas is visible
      setTimeout(() => {
        setCanvasVisible(true);
        
        // Force additional renders to ensure the globe appears
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.resize(); // Force resize
          for (let i = 0; i < 15; i++) {
            viewerRef.current.scene.requestRender();
          }
          console.log('Canvas made visible, additional renders requested');
        }
      }, 200);  // Shorter delay for better visibility
    }, 300);  // Shorter delay for faster loading
    
    // Force additional renders to ensure the globe appears
    const renderInterval = setInterval(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed() && forceRenderCount.current < 30) {
        viewerRef.current.scene.requestRender();
        forceRenderCount.current++;
        
        // Force globe update with each render
        if (viewerRef.current.scene && viewerRef.current.scene.globe) {
          viewerRef.current.scene.globe.update(viewerRef.current.clock.currentTime);
        }
      } else {
        clearInterval(renderInterval);
      }
    }, 100); // Faster interval for more frequent renders
  });

  // Pass the viewer reference to parent component when available
  useEffect(() => {
    if (viewerRef.current && onViewerReady && viewerReady) {
      onViewerReady(viewerRef.current);
    }
  }, [viewerReady, onViewerReady]);

  // Store the latest selectedLocation in a ref to avoid race conditions
  useEffect(() => {
    pendingLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  // Handle location changes - only initiate flights when the viewer is ready
  useEffect(() => {
    const viewer = viewerRef.current;
    const location = pendingLocationRef.current;
    
    // Only proceed if we have all the necessary conditions met
    if (!isInitialized || !viewerReady || isFlying || mapError || !viewer) {
      if (!isInitialized && location) {
        console.log("Waiting for Cesium to initialize before flying...");
      }
      return;
    }
    
    // Force additional renders to ensure the globe is visible before flying
    if (viewer && !viewer.isDestroyed()) {
      viewer.resize(); // Force resize
      for (let i = 0; i < 10; i++) {
        viewer.scene.requestRender();
      }
    }
    
    // If we have a pending location, fly to it
    if (location) {
      setIsFlying(true);
      console.log("Starting cinematic flight to location:", location.label);
      
      // Use the enhanced flight animation function
      flyToLocation(viewer, location, entityRef, {
        cinematic: cinematicFlight,
        onComplete: () => {
          console.log("Flight complete, transitioning to map view");
          setIsFlying(false);
          // Clear the pending location after flying to it
          pendingLocationRef.current = undefined;
          if (onFlyComplete) {
            onFlyComplete();
          }
        }
      });
    }
  }, [isInitialized, viewerReady, isFlying, mapError]); 
  
  return (
    <div className="w-full h-full relative">
      <CesiumMapLoading isLoading={isLoadingMap} mapError={mapError} />
      <div 
        ref={cesiumContainer} 
        className={`w-full h-full cesium-container ${canvasVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
          zIndex: 1,
          visibility: 'visible', // Always keep visible for better renders
          minHeight: '400px',
          display: 'block',
          transition: 'opacity 0.5s ease-in-out'
        }}
        data-cesium-container="true"
      />
    </div>
  );
};

export default CesiumMap;
