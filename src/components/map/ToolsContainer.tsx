
import React, { useEffect } from 'react';
import DrawingTools from '@/components/DrawingTools';
import DrawingToolHandler from '../explorer/map/DrawingToolHandler';
import MapTools from '../explorer/map/MapTools';

interface ToolsContainerProps {
  currentView: 'cesium' | 'leaflet';
  leafletMapRef: React.RefObject<any>;
  cesiumViewerRef: React.RefObject<any>;
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  handleToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onClearAll: () => void;
}

const ToolsContainer: React.FC<ToolsContainerProps> = ({
  currentView,
  leafletMapRef,
  cesiumViewerRef,
  activeTool,
  setActiveTool,
  handleToolSelect,
  onZoomIn,
  onZoomOut,
  onResetView,
  onClearAll
}) => {
  // Force Leaflet Draw to be loaded when the component mounts
  useEffect(() => {
    // Ensure leaflet-draw is loaded by checking if L.Control.Draw exists
    const ensureLeafletDrawLoaded = () => {
      const L = window.L;
      if (L && !L.Control.Draw) {
        console.warn("Leaflet Draw not detected, trying to load it");
        import('leaflet-draw').catch(err => {
          console.error("Failed to load leaflet-draw:", err);
        });
      }
    };
    
    ensureLeafletDrawLoaded();
  }, []);
  
  return (
    <>
      <DrawingTools 
        onToolSelect={handleToolSelect}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onResetView}
        onClearAll={onClearAll}
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
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetView={onResetView}
      />
    </>
  );
};

export default ToolsContainer;
