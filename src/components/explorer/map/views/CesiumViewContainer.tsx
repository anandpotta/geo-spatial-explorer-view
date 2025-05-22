
import React from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../../../CesiumMap';

interface CesiumViewContainerProps {
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onViewerReady: (viewer: any) => void;
  isCurrentView: boolean;
  transitioning: boolean;
  fadeIn: boolean;
  mapKey: number;
}

const CesiumViewContainer: React.FC<CesiumViewContainerProps> = ({
  selectedLocation,
  onMapReady,
  onFlyComplete,
  onViewerReady,
  isCurrentView,
  transitioning,
  fadeIn,
  mapKey
}) => {
  // Get styles for the container
  const getStyles = (): React.CSSProperties => {
    let opacity = isCurrentView ? 1 : 0;
    let transform = isCurrentView ? 'scale(1)' : 'scale(0.95)';
    let zIndex = isCurrentView ? 10 : 0;
    let visibility: 'visible' | 'hidden' = isCurrentView ? 'visible' : 'hidden';
    let pointerEvents: 'auto' | 'none' = isCurrentView ? 'auto' : 'none';
    
    // During transition, adjust the values
    if (transitioning) {
      opacity = isCurrentView ? 0.3 : 0.7;
      transform = isCurrentView ? 'scale(0.95)' : 'scale(0.98)';
      zIndex = isCurrentView ? 5 : 10;
      visibility = 'visible';
      pointerEvents = 'none';
    }
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      visibility,
      opacity,
      transform,
      zIndex,
      pointerEvents,
      transition: 'opacity 800ms ease-in-out, transform 800ms ease-in-out'
    };
  };
  
  const fadeInClass = fadeIn && isCurrentView ? 'animate-fade-in' : '';
  
  return (
    <div 
      className={`absolute inset-0 transition-all duration-500 ease-in-out ${fadeInClass}`}
      style={getStyles()}
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

export default CesiumViewContainer;
