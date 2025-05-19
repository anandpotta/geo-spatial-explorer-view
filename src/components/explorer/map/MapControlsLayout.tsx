
import React from 'react';
import DrawingTools from '@/components/DrawingTools';
import DrawingToolHandler from './DrawingToolHandler';
import MapTools from './MapTools';

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
  return (
    <>
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
    </>
  );
};

export default MapControlsLayout;
