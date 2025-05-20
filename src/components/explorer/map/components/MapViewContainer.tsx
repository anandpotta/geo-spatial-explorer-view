
import React from 'react';
import MapViews from '../MapViews';
import { Location } from '@/utils/geo-utils';

interface MapViewContainerProps {
  currentView: 'cesium' | 'leaflet';
  mapKey: number;
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  handleCesiumViewerRef: (viewer: any) => void;
  handleLeafletMapRef: (map: any) => void;
  activeTool: string | null;
  handleClearAll: () => void;
  fadeIn: boolean;
  viewTransitionInProgress: boolean;
}

const MapViewContainer: React.FC<MapViewContainerProps> = ({
  currentView,
  mapKey,
  selectedLocation,
  onMapReady,
  onFlyComplete,
  handleCesiumViewerRef,
  handleLeafletMapRef,
  activeTool,
  handleClearAll,
  fadeIn,
  viewTransitionInProgress
}) => {
  return (
    <div className="relative w-full h-full">
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
        fadeIn={fadeIn}
        viewTransitionInProgress={viewTransitionInProgress}
      />
    </div>
  );
};

export default MapViewContainer;
