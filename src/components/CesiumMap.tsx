
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Location } from '@/utils/geo-utils';
import CesiumMapLoading from './map/CesiumMapLoading';
import { useCesiumMap } from '@/hooks/useCesiumMap';
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
    // Add a small delay to ensure the globe is rendered before considering it "ready"
    setTimeout(() => {
      setViewerReady(true);
    }, 500);
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
    if (!isInitialized || !viewerReady || isFlying || mapError) {
      if (!isInitialized && location) {
        console.log("Waiting for Cesium to initialize before flying...");
      }
      return;
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
  }, [isInitialized, viewerReady, isFlying, mapError, viewerRef.current]); 
  
  return (
    <div className="w-full h-full relative">
      <CesiumMapLoading isLoading={isLoadingMap} mapError={mapError} />
      <div 
        ref={cesiumContainer} 
        className="w-full h-full cesium-container"
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
          zIndex: 1,
          visibility: isLoadingMap ? 'hidden' : 'visible',
          minHeight: '400px',
          display: 'block'
        }}
        data-cesium-container="true"
      />
    </div>
  );
};

export default CesiumMap;
