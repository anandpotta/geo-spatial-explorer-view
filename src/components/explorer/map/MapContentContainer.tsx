
import React from 'react';
import { Location } from '@/utils/geo-utils';
import DrawingTools from '@/components/DrawingTools';
import MapViews from './MapViews';
import MapTools from './MapTools';
import DrawingToolHandler from './DrawingToolHandler';
import { useMapRefs } from '@/hooks/map/useMapRefs';
import { useMapTransition } from '@/hooks/map/useMapTransition';
import { useMapControls } from '@/hooks/map/useMapControls';
import SearchOverlay from './components/SearchOverlay';
import TransitionOverlay from './components/TransitionOverlay';

interface MapContentContainerProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
  onClearLocation?: () => void;
  viewTransitionReady?: boolean;
  viewTransitionInProgress?: boolean;
}

const MapContentContainer: React.FC<MapContentContainerProps> = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect,
  onClearLocation,
  viewTransitionReady = true,
  viewTransitionInProgress = false
}) => {
  // Use extracted hooks
  const { cesiumViewerRef, leafletMapRef, handleCesiumViewerRef, handleLeafletMapRef } = useMapRefs();
  
  const { 
    mapKey, 
    handleMapReadyInternal 
  } = useMapTransition(currentView, selectedLocation, onMapReady);
  
  const {
    activeTool,
    setActiveTool,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleToolSelect,
    handleClearAll
  } = useMapControls(currentView, cesiumViewerRef, leafletMapRef);

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <MapViews
          currentView={currentView}
          mapKey={mapKey}
          selectedLocation={selectedLocation}
          onMapReady={handleMapReadyInternal}
          onFlyComplete={onFlyComplete}
          handleCesiumViewerRef={handleCesiumViewerRef}
          handleLeafletMapRef={handleLeafletMapRef}
          activeTool={activeTool}
          handleClearAll={handleClearAll}
          onClearLocation={onClearLocation}
          viewTransitionReady={viewTransitionReady}
          viewTransitionInProgress={viewTransitionInProgress}
        />
        
        <DrawingTools 
          onToolSelect={handleToolSelect}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
          onClearAll={handleClearAll}
        />
        
        <DrawingToolHandler
          currentView={currentView}
          leafletMapRef={leafletMapRef}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onToolSelect={handleToolSelect}
        />
        
        <MapTools
          currentView={currentView}
          cesiumViewerRef={cesiumViewerRef}
          leafletMapRef={leafletMapRef}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />
      </div>
      
      <SearchOverlay 
        onLocationSelect={onLocationSelect} 
        selectedLocation={selectedLocation} 
      />
      
      {/* Transition overlay that appears only during view transitions */}
      <TransitionOverlay isVisible={viewTransitionInProgress && !viewTransitionReady} />
    </div>
  );
};

export default MapContentContainer;
