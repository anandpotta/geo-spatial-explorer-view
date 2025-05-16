
import React from 'react';
import { Location } from '@/utils/geo-utils';
import MapContentContainer from './map/MapContentContainer';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
  onClearLocation?: () => void;
  viewTransitionReady?: boolean;
  viewTransitionInProgress?: boolean;
}

const MapContent: React.FC<MapContentProps> = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect,
  onClearLocation,
  viewTransitionReady = true,
  viewTransitionInProgress = false
}) => {
  return (
    <MapContentContainer
      currentView={currentView}
      selectedLocation={selectedLocation}
      onMapReady={onMapReady}
      onFlyComplete={onFlyComplete}
      onLocationSelect={onLocationSelect}
      onClearLocation={onClearLocation}
      viewTransitionReady={viewTransitionReady}
      viewTransitionInProgress={viewTransitionInProgress}
    />
  );
};

export default MapContent;
