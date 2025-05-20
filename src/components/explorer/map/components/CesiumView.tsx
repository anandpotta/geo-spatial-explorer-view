
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
  // Create a new style object that guarantees high z-index
  const enhancedStyle = {
    ...style,
    zIndex: 20, // Force higher z-index for 3D globe view
  };

  return (
    <div 
      className="absolute inset-0 transition-all duration-500 ease-in-out"
      style={enhancedStyle}
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
