
import React, { useEffect, useState } from 'react';
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
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Reset map ready state when mapKey changes
  useEffect(() => {
    setIsMapReady(false);
  }, [mapKey]);
  
  // Handle map ready event
  const handleMapReady = (map: any) => {
    console.log("LeafletViewContainer: Map is ready, notifying parent");
    setIsMapReady(true);
    if (onMapReady) {
      onMapReady(map);
    }
    
    // Force map invalidation after a short delay to ensure proper rendering
    if (map) {
      setTimeout(() => {
        if (map.invalidateSize) {
          console.log("LeafletViewContainer: Forcing map invalidation");
          map.invalidateSize(true);
        }
      }, 300);
    }
  };
  
  // Get styles for the container with improved visibility handling
  const getStyles = (): React.CSSProperties => {
    let opacity = isCurrentView ? 1 : 0;
    let transform = isCurrentView ? 'scale(1)' : 'scale(0.95)';
    let zIndex = isCurrentView ? 10 : 0;
    // Always keep the map visible when it's the current view
    let visibility: 'visible' | 'hidden' = isCurrentView || transitioning ? 'visible' : 'hidden';
    let pointerEvents: 'auto' | 'none' = isCurrentView && !transitioning ? 'auto' : 'none';
    
    // During transition, adjust the values but keep map visible
    if (transitioning) {
      opacity = isCurrentView ? 1 : 0.3;  // Keep more opacity for current view
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
      transition: 'opacity 800ms ease-in-out, transform 800ms ease-in-out',
      backgroundColor: isCurrentView ? 'white' : 'transparent'
    };
  };
  
  // Class for fade-in animation
  const fadeInClass = fadeIn && isCurrentView ? 'animate-fade-in' : '';
  
  return (
    <div 
      className={`absolute inset-0 transition-all duration-500 ease-in-out ${fadeInClass}`}
      style={getStyles()}
      data-map-type="leaflet"
    >
      <LeafletMap 
        selectedLocation={selectedLocation} 
        onMapReady={handleMapReady}
        activeTool={activeTool}
        key={`leaflet-${mapKey}`}
        onClearAll={onClearAll}
        isMapReady={isMapReady}
      />
    </div>
  );
};

export default LeafletViewContainer;
