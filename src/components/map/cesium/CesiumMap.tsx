
import React from 'react';
import * as Cesium from 'cesium';
import { Location } from '@/utils/geo-utils';
import CesiumMapCore from './CesiumMapCore';

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
}

/**
 * Wrapper component for the Cesium map with proper styling
 */
const CesiumMap: React.FC<CesiumMapProps> = (props) => {
  return (
    <div className="w-full h-full relative" style={{ 
      zIndex: 10000, 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      background: 'black',
      isolation: 'isolate', // Create a new stacking context
    }}>
      <CesiumMapCore {...props} />
    </div>
  );
};

export default CesiumMap;
