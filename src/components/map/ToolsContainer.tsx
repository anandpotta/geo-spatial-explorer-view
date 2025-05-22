
import React, { useEffect } from 'react';
import DrawingTools from '@/components/DrawingTools';
import DrawingToolHandler from '../explorer/map/DrawingToolHandler';
import MapTools from '../explorer/map/MapTools';
import { initializeLeafletDrawComplete } from '@/utils/leaflet-draw-initializer';

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
  // Initialize Leaflet Draw when the component mounts
  useEffect(() => {
    // Make sure leaflet-draw is properly initialized
    const initializeDrawingTools = async () => {
      console.log("ToolsContainer: Initializing Leaflet Draw");
      
      try {
        // Import leaflet-draw
        await import('leaflet-draw');
        
        // Initialize Leaflet Draw
        initializeLeafletDrawComplete();
        
        console.log("ToolsContainer: Leaflet Draw initialized successfully");
      } catch (err) {
        console.error("Failed to initialize Leaflet Draw:", err);
      }
    };
    
    initializeDrawingTools();
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
