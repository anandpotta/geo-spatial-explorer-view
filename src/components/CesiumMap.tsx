
import { useEffect, useRef, useState } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Location } from '@/utils/geo-utils';
import CesiumMapLoading from './map/CesiumMapLoading';
import { useCesiumMap } from '@/hooks/useCesiumMap';
import { flyToLocation } from '@/utils/cesium-utils';

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
}

const CesiumMap = ({ selectedLocation, onMapReady, onFlyComplete }: CesiumMapProps) => {
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
    
    // Use the extracted flight animation function
    flyToLocation(viewer, selectedLocation, entityRef, {
      onComplete: () => {
        setIsFlying(false);
        if (onFlyComplete) {
          onFlyComplete();
        }
      }
    });
  }, [selectedLocation, onFlyComplete, mapError, isFlying, isInitialized, viewerRef, entityRef]);
  
  return (
    <div className="w-full h-full relative">
      <CesiumMapLoading isLoading={isLoadingMap} mapError={mapError} />
      <div 
        ref={cesiumContainer} 
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </div>
  );
};

export default CesiumMap;
