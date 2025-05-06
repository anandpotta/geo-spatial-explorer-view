
import React from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMapCore from './CesiumMapCore';

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: any) => void;
}

/**
 * Wrapper component for the 3D globe with proper styling
 * (Previously Cesium, now using Three.js)
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
