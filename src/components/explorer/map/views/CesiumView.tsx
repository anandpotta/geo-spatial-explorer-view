
import React from 'react';
import CesiumMap from '@/components/CesiumMap';
import { Location } from '@/utils/geo-utils';
import { getCesiumStyles } from './ViewTransitionStyles';

interface CesiumViewProps {
  currentView: 'cesium' | 'leaflet';
  transitioning: boolean;
  viewTransitionInProgress: boolean;
  selectedLocation?: Location;
  cesiumKey: string;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onViewerReady: (viewer: any) => void;
  fadeIn: boolean;
}

const CesiumView: React.FC<CesiumViewProps> = ({
  currentView,
  transitioning,
  viewTransitionInProgress,
  selectedLocation,
  cesiumKey,
  onMapReady,
  onFlyComplete,
  onViewerReady,
  fadeIn
}) => {
  const styles = getCesiumStyles(currentView, transitioning);
  const shouldRender = currentView === 'cesium' || transitioning || viewTransitionInProgress;
  const fadeInClass = fadeIn && currentView === 'cesium' ? 'animate-fade-in' : '';

  return (
    <div 
      className={`absolute inset-0 transition-all duration-300 ease-in-out ${fadeInClass}`}
      style={styles}
      data-map-type="cesium"
    >
      {shouldRender && (
        <CesiumMap 
          selectedLocation={selectedLocation}
          onMapReady={() => onMapReady()}
          onFlyComplete={onFlyComplete}
          cinematicFlight={true}
          key={cesiumKey}
          onViewerReady={onViewerReady}
        />
      )}
    </div>
  );
};

export default CesiumView;
