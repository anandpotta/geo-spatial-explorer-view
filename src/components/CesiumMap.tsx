
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
 * Main Map component (previously CesiumMap, now using ThreeJS)
 */
const CesiumMap: React.FC<CesiumMapProps> = (props) => {
  return (
    <div className="w-full h-full relative">
      <ThreeGlobeMap 
        selectedLocation={props.selectedLocation}
        onMapReady={props.onMapReady}
        onFlyComplete={props.onFlyComplete}
      />
    </div>
  );
};

export default CesiumMap;
