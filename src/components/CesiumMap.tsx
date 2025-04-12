
import React from 'react';
import * as Cesium from 'cesium';
import { Location } from '@/utils/geo-utils';
import CesiumMap from './map/cesium/CesiumMap';

interface CesiumMapWrapperProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
}

/**
 * Main CesiumMap component that delegates to the implementation
 * This maintains backward compatibility with existing code
 */
const CesiumMapWrapper: React.FC<CesiumMapWrapperProps> = (props) => {
  return <CesiumMap {...props} />;
};

export default CesiumMapWrapper;
