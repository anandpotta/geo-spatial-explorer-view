
import React, { useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapViewTransition } from '@/hooks/useMapViewTransition';
import { useLastSelectedLocation } from '@/hooks/useLastSelectedLocation';
import CesiumViewContainer from './views/CesiumViewContainer';
import LeafletViewContainer from './views/LeafletViewContainer';
import TransitionOverlay from './views/TransitionOverlay';

interface MapViewsProps {
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

const MapViews: React.FC<MapViewsProps> = ({
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
  // Use our custom hooks for state management
  const { transitioning, fadeIn } = useMapViewTransition(currentView);
  const lastSelectedLocationRef = useLastSelectedLocation(selectedLocation);
  
  return (
    <>
      <CesiumViewContainer 
        selectedLocation={selectedLocation}
        onMapReady={onMapReady}
        onFlyComplete={onFlyComplete}
        onViewerReady={handleCesiumViewerRef}
        isCurrentView={currentView === 'cesium'}
        transitioning={transitioning}
        fadeIn={fadeIn}
        mapKey={mapKey}
      />
      
      <LeafletViewContainer 
        selectedLocation={selectedLocation}
        onMapReady={handleLeafletMapRef}
        activeTool={activeTool}
        isCurrentView={currentView === 'leaflet'}
        transitioning={transitioning}
        fadeIn={fadeIn}
        mapKey={mapKey}
        onClearAll={handleClearAll}
      />
      
      <TransitionOverlay isVisible={transitioning} />
    </>
  );
};

export default MapViews;
