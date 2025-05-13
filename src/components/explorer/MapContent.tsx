import React from 'react';
import { Location } from '@/utils/geo-utils';
import MapContentContainer from './map/MapContentContainer';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
  viewTransitionReady?: boolean;
}

const MapContent: React.FC<MapContentProps> = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect,
  viewTransitionReady = true 
}) => {
  return (
    <MapContentContainer
      currentView={currentView}
      selectedLocation={selectedLocation}
      onMapReady={onMapReady}
      onFlyComplete={onFlyComplete}
      onLocationSelect={onLocationSelect}
      viewTransitionReady={viewTransitionReady}
    />
  );
};

export default MapContent;
