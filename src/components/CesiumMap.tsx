
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
  
  // Use the extracted Cesium map hook
  const { 
    viewerRef, 
    entityRef, 
    isLoadingMap, 
    mapError,
    isInitialized
  } = useCesiumMap(cesiumContainer, onMapReady);

  // Pass the viewer reference to parent component when available
  useEffect(() => {
    if (viewerRef.current && onViewerReady && isInitialized) {
      onViewerReady(viewerRef.current);
    }
  }, [viewerRef.current, onViewerReady, isInitialized]);

  // Handle location changes - this effect should run when selectedLocation changes
  useEffect(() => {
    const viewer = viewerRef.current;
    
    if (!viewer || !selectedLocation || mapError || isFlying || !isInitialized) {
      if (!isInitialized && selectedLocation) {
        console.log("Waiting for Cesium to initialize before flying...");
      }
      return;
    }
    
    setIsFlying(true);
    console.log("Starting cinematic flight to location:", selectedLocation.label);
    
    // Use the enhanced flight animation function
    flyToLocation(viewer, selectedLocation, entityRef, {
      cinematic: cinematicFlight,
      onComplete: () => {
        console.log("Flight complete, transitioning to map view");
        setIsFlying(false);
        if (onFlyComplete) {
          onFlyComplete();
        }
      }
    });
  }, [selectedLocation, onFlyComplete, mapError, isFlying, isInitialized, viewerRef, entityRef, cinematicFlight]);
  
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
