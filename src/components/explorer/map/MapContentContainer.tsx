
import React, { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import MapViews from './MapViews';
import MapControlsLayout from './MapControlsLayout';
import MapSearchOverlay from './MapSearchOverlay';
import { useMapRefs } from '@/hooks/useMapRefs';
import { useMapNavigation } from '@/hooks/useMapNavigation';
import { useDrawingToolsManager } from '@/hooks/useDrawingToolsManager';
import { toast } from '@/components/ui/use-toast';

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
  // Map references and state management
  const {
    cesiumViewerRef,
    leafletMapRef,
    mapReady,
    mapKey,
    viewTransitionInProgress,
    handleCesiumViewerRef,
    handleLeafletMapRef,
    handleMapReady,
    handleViewTransition
  } = useMapRefs();

  // Navigation controls
  const {
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleClearAll
  } = useMapNavigation(currentView, cesiumViewerRef, leafletMapRef);

  // Drawing tools management
  const { activeTool, setActiveTool, handleToolSelect } = useDrawingToolsManager();
  
  // Handle view changes
  useEffect(() => {
    const cleanup = handleViewTransition(currentView);
    return cleanup;
  }, [currentView]);

  // Display notifications when map is ready
  useEffect(() => {
    if (mapReady && !viewTransitionInProgress) {
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
  }, [mapReady, viewTransitionInProgress, currentView]);

  // Handler for map ready event
  const handleMapReadyInternal = () => {
    handleMapReady();
    onMapReady();
  };

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
        />
        
        <MapControlsLayout
          currentView={currentView}
          cesiumViewerRef={cesiumViewerRef}
          leafletMapRef={leafletMapRef}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          handleToolSelect={handleToolSelect}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleResetView={handleResetView}
          handleClearAll={handleClearAll}
        />
      </div>
      
      <MapSearchOverlay onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default MapContentContainer;
