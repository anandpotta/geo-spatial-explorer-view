
import React from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapReferenceManager } from '@/hooks/useMapReferenceManager';
import { useMapNavigationControls } from '@/hooks/useMapNavigationControls';
import { useDrawingToolManager } from '@/hooks/useDrawingToolManager';
import { useClearMapOperations } from '@/hooks/useClearMapOperations';
import MapViewsContainer from './MapViewsContainer';
import ToolsContainer from './ToolsContainer';
import SearchContainer from './SearchContainer';
import ClearConfirmationDialog from './ClearConfirmationDialog';

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
  // Use custom hooks for state management
  const {
    cesiumViewerRef,
    leafletMapRef,
    mapKey,
    viewTransitionInProgress,
    handleCesiumViewerRef,
    handleLeafletMapRef,
    handleViewChange
  } = useMapReferenceManager();

  // Navigation controls
  const {
    handleZoomIn,
    handleZoomOut,
    handleResetView
  } = useMapNavigationControls(currentView, cesiumViewerRef, leafletMapRef);

  // Drawing tools management
  const {
    activeTool,
    setActiveTool,
    handleToolSelect
  } = useDrawingToolManager();
  
  // Clear operations
  const {
    isClearDialogOpen,
    requestClearAll,
    handleClearAll,
    handleCancelClear
  } = useClearMapOperations(currentView, leafletMapRef);

  // Handle view changes
  React.useEffect(() => {
    return handleViewChange();
  }, [currentView]);

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <MapViewsContainer
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
        
        <ToolsContainer
          currentView={currentView}
          leafletMapRef={leafletMapRef}
          cesiumViewerRef={cesiumViewerRef}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          handleToolSelect={handleToolSelect}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onClearAll={requestClearAll}
        />
      </div>
      
      <SearchContainer onLocationSelect={onLocationSelect} />
      
      <ClearConfirmationDialog
        isOpen={isClearDialogOpen}
        onConfirm={handleClearAll}
        onCancel={handleCancelClear}
      />
    </div>
  );
};

export default MapContentContainer;
