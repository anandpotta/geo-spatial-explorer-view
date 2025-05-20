
import React from 'react';
import { Location } from '@/utils/geo-utils';
import DrawingTools from '../../DrawingTools';
import DrawingToolHandler from './DrawingToolHandler';
import MapTools from './MapTools';
import { toast } from '@/components/ui/use-toast';
import { useMapRefs } from './hooks/useMapRefs';
import { useMapTools } from './hooks/useMapTools';
import { useDrawingTools } from './hooks/useDrawingTools';
import { useViewTransition } from './hooks/useViewTransition';
import MapViewContainer from './components/MapViewContainer';
import SearchContainer from './components/SearchContainer';

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
  // Use our custom hooks to manage state and functionality
  const {
    cesiumViewerRef,
    leafletMapRef,
    mapKey,
    setMapKey,
    viewTransitionInProgress,
    setViewTransitionInProgress,
    mapReady,
    setMapReady,
    previousViewRef,
    handleCesiumViewerRef,
    handleLeafletMapRef
  } = useMapRefs();

  const {
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleClearAll
  } = useMapTools(currentView, cesiumViewerRef, leafletMapRef);

  const {
    activeTool,
    setActiveTool,
    handleToolSelect
  } = useDrawingTools();

  const {
    fadeIn,
    triggerFadeIn
  } = useViewTransition(
    currentView, 
    previousViewRef, 
    setViewTransitionInProgress, 
    setMapKey, 
    setMapReady
  );

  const handleMapReadyInternal = () => {
    setMapReady(true);
    onMapReady();

    // Trigger fade-in effect when map is ready
    triggerFadeIn();
    
    // Display appropriate toast based on current view
    if (mapReady) {
      if (currentView === 'cesium') {
        toast({
          title: "3D Globe Ready",
          description: "Interactive 3D globe view has been loaded.",
          variant: "default",
        });
      } else if (currentView === 'leaflet') {
        toast({
          title: "Map View Ready",
          description: "Tiled map view has been loaded successfully.",
          variant: "default",
        });
      }
    }
  };

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <MapViewContainer
        currentView={currentView}
        mapKey={mapKey}
        selectedLocation={selectedLocation}
        onMapReady={handleMapReadyInternal}
        onFlyComplete={onFlyComplete}
        handleCesiumViewerRef={handleCesiumViewerRef}
        handleLeafletMapRef={handleLeafletMapRef}
        activeTool={activeTool}
        handleClearAll={handleClearAll}
        fadeIn={fadeIn}
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

      <SearchContainer onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default MapContentContainer;
