
import React, { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapTransition } from './hooks/useMapTransition';
import { getCesiumStyles, getLeafletStyles } from './utils/transitionStylesHelper';
import CesiumView from './components/CesiumView';
import LeafletView from './components/LeafletView';
import TransitionOverlay from './components/TransitionOverlay';

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
  fadeIn?: boolean;
  viewTransitionInProgress?: boolean;
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
  handleClearAll,
  fadeIn = false,
  viewTransitionInProgress = false
}) => {
  const { transitioning } = useMapTransition({
    viewTransitionInProgress,
    currentView
  });
  
  const [lastSelectedLocation, setLastSelectedLocation] = useState<Location | undefined>(undefined);
  
  // Track location changes to prevent duplicate transitions
  useEffect(() => {
    if (selectedLocation && 
        (!lastSelectedLocation || 
         selectedLocation.id !== lastSelectedLocation.id)) {
      console.log('New location selected:', selectedLocation.label);
      setLastSelectedLocation(selectedLocation);
    }
  }, [selectedLocation, lastSelectedLocation]);
  
  // Add fade-in effect when a view becomes active
  const fadeInClass = fadeIn ? 'animate-fade-in' : '';
  
  // Get styles for each view
  const cesiumStyles = getCesiumStyles(currentView, transitioning);
  const leafletStyles = getLeafletStyles(currentView, transitioning);
  
  return (
    <>
      <CesiumView
        selectedLocation={selectedLocation}
        onMapReady={onMapReady}
        onFlyComplete={onFlyComplete}
        onViewerReady={handleCesiumViewerRef}
        style={{
          ...cesiumStyles,
          className: currentView === 'cesium' ? fadeInClass : ''
        }}
        mapKey={mapKey}
      />
      
      <LeafletView
        selectedLocation={selectedLocation}
        onMapReady={handleLeafletMapRef}
        activeTool={activeTool}
        onClearAll={handleClearAll}
        style={{
          ...leafletStyles,
          className: currentView === 'leaflet' ? fadeInClass : ''
        }}
        mapKey={mapKey}
      />
      
      <TransitionOverlay show={transitioning} />
    </>
  );
};

export default MapViews;
