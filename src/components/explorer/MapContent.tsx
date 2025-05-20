
import React from 'react';
import { Location } from '@/utils/geo-utils';
import MapContentContainer from './MapContentContainer';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
}

const MapContent = (props: MapContentProps) => {
  return <MapContentContainer {...props} />;
};

export default MapContent;
