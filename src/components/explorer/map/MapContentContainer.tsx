
import React, { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import DrawingTools from '../../DrawingTools';
import LocationSearch from '../../LocationSearch';
import MapViews from './MapViews';
import MapTools from './MapTools';
import DrawingToolHandler from './DrawingToolHandler';
import { useMapRefs } from '@/hooks/useMapRefs';
import MapControlsHandler from './MapControlsHandler';
import ToolSelectionHandler from './ToolSelectionHandler';

interface MapContentContainerProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
}

const MapContentContainer: React.FC<MapContentContainerProps> = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect 
}) => {
  // Use our custom hooks for state management
  const {
    cesiumViewerRef,
    leafletMapRef,
    mapKey,
    handleCesiumViewerRef,
    handleLeafletMapRef,
    handleMapReadyInternal,
    updateMapKeyOnViewChange
  } = useMapRefs();

  // Set up tool selection functionality
  const { activeTool, handleToolSelect } = ToolSelectionHandler({
    onToolChange: (tool) => console.log(`Tool changed to: ${tool}`)
  });

  // Set up map controls
  const { 
    handleZoomIn, 
    handleZoomOut, 
    handleResetView, 
    handleClearAll 
  } = MapControlsHandler({
    currentView,
    cesiumViewerRef,
    leafletMapRef
  });

  // Update map key when view changes
  useEffect(() => {
    return updateMapKeyOnViewChange(currentView);
  }, [currentView]);

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <MapViews
          currentView={currentView}
          mapKey={mapKey}
          selectedLocation={selectedLocation}
          onMapReady={() => handleMapReadyInternal(onMapReady)}
          onFlyComplete={onFlyComplete}
          handleCesiumViewerRef={handleCesiumViewerRef}
          handleLeafletMapRef={handleLeafletMapRef}
          activeTool={activeTool}
          handleClearAll={handleClearAll}
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
          setActiveTool={(tool) => handleToolSelect(tool || '')}
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
      
      <div 
        className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
        style={{ 
          maxWidth: '400px',
        }}
      >
        <LocationSearch onLocationSelect={onLocationSelect} />
      </div>
    </div>
  );
};

export default MapContentContainer;
