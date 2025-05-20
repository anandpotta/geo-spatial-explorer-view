
import React from 'react';
import { Location } from '@/utils/geo-utils';
import MapContentContainer from './map/MapContentContainer';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
  stayAtCurrentPosition?: boolean;
}

const MapContent = (props: MapContentProps) => {
  // Add logging to help debug any issues
  console.log("MapContent rendering with props:", {
    view: props.currentView,
    stayAtCurrentPosition: props.stayAtCurrentPosition
  });
  
  return (
    <div className="relative flex-1 overflow-hidden">
      <MapContentContainer {...props} />
    </div>
  );
};

export default MapContent;
