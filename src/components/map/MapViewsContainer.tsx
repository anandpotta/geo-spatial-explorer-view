
import React from 'react';
import { Location } from '@/utils/geo-utils';
import MapViews from '../explorer/map/MapViews';

interface MapViewsContainerProps {
  currentView: 'cesium' | 'leaflet';
  mapKey: number;
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  handleCesiumViewerRef: (viewer: any) => void;
  handleLeafletMapRef: (map: any) => void;
  activeTool: string | null;
  handleClearAll: () => void;
}

const MapViewsContainer: React.FC<MapViewsContainerProps> = ({
  currentView,
  mapKey,
  selectedLocation,
  onMapReady,
  onFlyComplete,
  handleCesiumViewerRef,
  handleLeafletMapRef,
  activeTool,
  handleClearAll
}) => {
  return (
    <MapViews
      currentView={currentView}
      mapKey={mapKey}
      selectedLocation={selectedLocation}
      onMapReady={onMapReady}
      onFlyComplete={onFlyComplete}
      handleCesiumViewerRef={handleCesiumViewerRef}
      handleLeafletMapRef={handleLeafletMapRef}
      activeTool={activeTool}
      handleClearAll={handleClearAll}
    />
  );
};

export default MapViewsContainer;
