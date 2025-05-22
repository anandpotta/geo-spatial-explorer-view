
import React from 'react';
import { Location } from '@/utils/geo-utils';
import LeafletMap from '../../../map/LeafletMap';

interface LeafletViewContainerProps {
  selectedLocation: Location | undefined;
  onMapReady: (map: any) => void;
  activeTool: string | null;
  isCurrentView: boolean;
  transitioning: boolean;
  fadeIn: boolean;
  mapKey: number;
  onClearAll: () => void;
}

const LeafletViewContainer: React.FC<LeafletViewContainerProps> = ({
  selectedLocation,
  onMapReady,
  activeTool,
  isCurrentView,
  transitioning,
  fadeIn,
  mapKey,
  onClearAll
}) => {
  // Get styles for the container
  const getStyles = (): React.CSSProperties => {
    const oppositeIsCurrentView = !isCurrentView;
    
    let opacity = isCurrentView ? 1 : 0;
    let transform = isCurrentView ? 'scale(1)' : 'scale(0.95)';
    let zIndex = isCurrentView ? 10 : 0;
    let visibility: 'visible' | 'hidden' = isCurrentView || transitioning ? 'visible' : 'hidden';
    let pointerEvents: 'auto' | 'none' = isCurrentView && !transitioning ? 'auto' : 'none';
    
    // During transition, adjust the values
    if (transitioning) {
      opacity = 1 - (oppositeIsCurrentView ? 0.3 : 0.7);
      transform = isCurrentView ? 'scale(1)' : 'scale(0.95)';
      zIndex = isCurrentView ? 10 : 5;
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
      data-map-type="leaflet"
    >
      <LeafletMap 
        selectedLocation={selectedLocation} 
        onMapReady={onMapReady}
        activeTool={activeTool}
        key={`leaflet-${mapKey}`}
        onClearAll={onClearAll}
      />
    </div>
  );
};

export default LeafletViewContainer;
