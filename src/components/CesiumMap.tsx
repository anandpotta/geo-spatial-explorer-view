
import React, { useEffect } from 'react';
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
 * Main Map component (using ThreeJS)
 */
const CesiumMap: React.FC<CesiumMapProps> = (props) => {
  // Validate location before passing it to ThreeGlobeMap
  const isValidLocation = (location?: Location) => {
    return location && 
           typeof location.x === 'number' && !isNaN(location.x) && 
           typeof location.y === 'number' && !isNaN(location.y);
  };
  
  // Only pass the location if it's valid
  const validatedLocation = isValidLocation(props.selectedLocation) ? props.selectedLocation : undefined;
  
  return (
    <div className="w-full h-full relative" style={{ backgroundColor: 'black' }}>
      <ThreeGlobeMap 
        selectedLocation={validatedLocation}
        onMapReady={(viewer) => {
          if (props.onMapReady) props.onMapReady();
          if (props.onViewerReady && viewer) props.onViewerReady(viewer);
        }}
        onFlyComplete={props.onFlyComplete}
      />
    </div>
  );
};

export default CesiumMap;
