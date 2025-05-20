
import React from 'react';
import { Location } from '@/utils/geo-utils';
import DrawingTools from '../../DrawingTools';
import MapViews from './MapViews';
import MapTools from './MapTools';
import DrawingToolHandler from './DrawingToolHandler';
import LocationSearchContainer from './LocationSearchContainer';
import { useMapReferences } from '@/hooks/useMapReferences';
import { useMapViewTransition } from '@/hooks/useMapViewTransition';
import { useMapTools } from '@/hooks/useMapTools';
import { useDrawingToolState } from '@/hooks/useDrawingToolState';

interface MapContentContainerProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
  stayAtCurrentPosition?: boolean;
}

const MapContentContainer: React.FC<MapContentContainerProps> = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect,
  stayAtCurrentPosition = false
}) => {
  // Use custom hooks to organize functionality
  const { cesiumViewerRef, leafletMapRef, handleCesiumViewerRef, handleLeafletMapRef } = useMapReferences();
  const { mapKey, handleMapReady } = useMapViewTransition(currentView);
  const { handleZoomIn, handleZoomOut, handleResetView } = useMapTools(currentView, cesiumViewerRef, leafletMapRef);
  const { activeTool, setActiveTool, handleToolSelect, handleClearAll } = useDrawingToolState();
  
  // Log the stayAtCurrentPosition value for debugging
  React.useEffect(() => {
    console.log("MapContentContainer stayAtCurrentPosition:", stayAtCurrentPosition);
  }, [stayAtCurrentPosition]);

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <MapViews
          currentView={currentView}
          mapKey={mapKey}
          selectedLocation={selectedLocation}
          onMapReady={() => handleMapReady(onMapReady)}
          onFlyComplete={onFlyComplete}
          handleCesiumViewerRef={handleCesiumViewerRef}
          handleLeafletMapRef={handleLeafletMapRef}
          activeTool={activeTool}
          handleClearAll={() => handleClearAll(leafletMapRef)}
          stayAtCurrentPosition={stayAtCurrentPosition}
        />
        
        <DrawingTools 
          onToolSelect={handleToolSelect}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
          onClearAll={() => handleClearAll(leafletMapRef)}
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
      
      <LocationSearchContainer onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default MapContentContainer;
