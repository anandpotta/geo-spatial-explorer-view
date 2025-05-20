
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
  return <MapContentContainer {...props} />;
};

export default MapContent;
