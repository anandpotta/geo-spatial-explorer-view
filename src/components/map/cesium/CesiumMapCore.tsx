
import React, { useState, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import ThreeGlobeMap from '../ThreeGlobeMap';

interface CesiumMapCoreProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: any) => void;
}

/**
 * Core map component (now using Three.js instead of Cesium)
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
  const viewerRef = useRef<any>(null);

  // Handle viewer being ready
  const handleViewerReady = (viewer: any) => {
    console.log("ThreeGlobeMap: Viewer is ready");
    viewerRef.current = viewer;
    setViewerReady(true);
    
    if (onViewerReady) {
      onViewerReady(viewer);
    }
  };

  // Handle flying operations completion
  const handleFlyComplete = () => {
    setIsFlying(false);
    if (onFlyComplete) {
      onFlyComplete();
    }
  };
  
  return (
    <ThreeGlobeMap
      selectedLocation={selectedLocation}
      onMapReady={() => {
        if (onMapReady) onMapReady();
      }}
      onFlyComplete={handleFlyComplete}
    />
  );
};

export default CesiumMapCore;
