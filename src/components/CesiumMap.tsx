
import React from 'react';
import { Location } from '@/utils/geo-utils';
import ThreeGlobeMap from './map/ThreeGlobeMap';

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: any) => void;
}

/**
 * Main Map component (now using ThreeJS)
 */
const CesiumMap: React.FC<CesiumMapProps> = (props) => {
  // Handle the onMapReady and onViewerReady callbacks
  const handleMapReady = (viewer: any) => {
    console.log("CesiumMap: Map is ready, viewer:", !!viewer);
    
    if (props.onMapReady) {
      console.log("CesiumMap: Calling onMapReady callback");
      props.onMapReady();
    }
    
    if (props.onViewerReady && viewer) {
      console.log("CesiumMap: Calling onViewerReady callback with viewer");
      props.onViewerReady(viewer);
    }
  };
  
  return (
    <div className="w-full h-full relative" style={{ backgroundColor: 'black' }}>
      <ThreeGlobeMap 
        selectedLocation={props.selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={props.onFlyComplete}
      />
    </div>
  );
};

export default CesiumMap;
