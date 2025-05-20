
import React from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../../../CesiumMap';

interface CesiumViewProps {
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onViewerReady: (viewer: any) => void;
  style: React.CSSProperties;
  mapKey: number;
}

const CesiumView: React.FC<CesiumViewProps> = ({ 
  selectedLocation,
  onMapReady,
  onFlyComplete,
  onViewerReady,
  style,
  mapKey
}) => {
  return (
    <div 
      className="absolute inset-0 transition-all duration-500 ease-in-out"
      style={style}
      data-map-type="cesium"
    >
      <CesiumMap 
        selectedLocation={selectedLocation}
        onMapReady={onMapReady}
        onFlyComplete={onFlyComplete}
        cinematicFlight={true}
        key={`cesium-${mapKey}`}
        onViewerReady={onViewerReady}
      />
    </div>
  );
};

export default CesiumView;
