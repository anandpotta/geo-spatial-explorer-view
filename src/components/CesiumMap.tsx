
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
 * Note: We keep the name "CesiumMap" for backward compatibility
 */
const CesiumMap: React.FC<CesiumMapProps> = (props) => {
  const handleMapReady = (viewer: any) => {
    if (props.onMapReady) props.onMapReady();
    if (props.onViewerReady && viewer) props.onViewerReady(viewer);
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
