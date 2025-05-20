
import React from 'react';
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
  
  const [lastSelectedLocation, setLastSelectedLocation] = React.useState<Location | undefined>(undefined);
  const cesiumReadyRef = React.useRef(false);
  
  // Track location changes to prevent duplicate transitions
  React.useEffect(() => {
    if (selectedLocation && 
        (!lastSelectedLocation || 
         selectedLocation.id !== lastSelectedLocation.id)) {
      console.log('New location selected:', selectedLocation.label);
      setLastSelectedLocation(selectedLocation);
    }
  }, [selectedLocation, lastSelectedLocation]);
  
  // Handle Cesium map ready
  const handleCesiumReady = () => {
    if (!cesiumReadyRef.current) {
      cesiumReadyRef.current = true;
      console.log("Cesium view is ready");
      onMapReady();
    }
  };
  
  // Get styles for each view
  const cesiumStyles = getCesiumStyles(currentView, transitioning);
  const leafletStyles = getLeafletStyles(currentView, transitioning);
  
  return (
    <>
      <CesiumView
        selectedLocation={selectedLocation}
        onMapReady={handleCesiumReady}
        onFlyComplete={onFlyComplete}
        onViewerReady={handleCesiumViewerRef}
        style={cesiumStyles}
        mapKey={mapKey}
      />
      
      <LeafletView
        selectedLocation={selectedLocation}
        onMapReady={handleLeafletMapRef}
        activeTool={activeTool}
        onClearAll={handleClearAll}
        style={leafletStyles}
        mapKey={mapKey}
      />
      
      <TransitionOverlay show={transitioning} />
      
      {fadeIn && (
        <div className="absolute inset-0 pointer-events-none z-5 bg-black bg-opacity-20" 
             style={{ animation: 'fadeIn 300ms ease-out forwards' }}>
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 1; }
                to { opacity: 0; }
              }
            `}
          </style>
        </div>
      )}
    </>
  );
};

export default MapViews;
