
import React, { useState } from 'react';
import DrawingTools from '@/components/DrawingTools';
import DrawingToolHandler from './DrawingToolHandler';
import MapTools from './MapTools';
import ConfirmationDialog from '@/components/map/drawing/ConfirmationDialog';

interface MapControlsLayoutProps {
  currentView: 'cesium' | 'leaflet';
  cesiumViewerRef: React.MutableRefObject<any>;
  leafletMapRef: React.MutableRefObject<any>;
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  handleToolSelect: (tool: string) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetView: () => void;
  handleClearAll: () => void;
}

const MapControlsLayout: React.FC<MapControlsLayoutProps> = ({
  currentView,
  cesiumViewerRef,
  leafletMapRef,
  activeTool,
  setActiveTool,
  handleToolSelect,
  handleZoomIn,
  handleZoomOut,
  handleResetView,
  handleClearAll
}) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleClearRequest = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmClear = () => {
    setIsConfirmDialogOpen(false);
    handleClearAll();
  };

  const handleCancelClear = () => {
    setIsConfirmDialogOpen(false);
  };
  
  return (
    <>
      <DrawingTools 
        onToolSelect={handleToolSelect}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        onClearAll={handleClearRequest}
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
      
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        title="Clear All Map Data"
        description="Are you sure you want to clear all drawings and markers from the map? This action cannot be undone."
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
      />
    </>
  );
};

export default MapControlsLayout;
