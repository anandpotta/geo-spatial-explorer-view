
import React, { useRef, useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import DrawingTools from '@/components/DrawingTools';
import LocationSearch from '@/components/LocationSearch';
import { zoomIn, zoomOut, resetCamera } from '@/utils/threejs-camera';
import MapViews from '../explorer/map/MapViews';
import MapTools from '../explorer/map/MapTools';
import DrawingToolHandler from '../explorer/map/DrawingToolHandler';
import { toast } from '@/components/ui/use-toast';
import ConfirmationDialog from './drawing/ConfirmationDialog';

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
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  // Reset map instance when view changes
  useEffect(() => {
    setMapKey(Date.now());
    
    // Set transition flag
    setViewTransitionInProgress(true);
    const timer = setTimeout(() => {
      setViewTransitionInProgress(false);
    }, 1000); // Allow time for transition to complete
    
    return () => clearTimeout(timer);
  }, [currentView]);

  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };

  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
    // When Leaflet map is ready after transition, notify user
    if (currentView === 'leaflet' && !viewTransitionInProgress) {
      toast({
        title: "Map View Ready",
        description: "Tiled map view has been loaded successfully.",
        variant: "default",
      });
    }
  };

  const handleZoomIn = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomIn(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() + 1);
      } catch (err) {
        console.error('Error zooming in on leaflet map:', err);
      }
    }
  };

  const handleZoomOut = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomOut(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() - 1);
      } catch (err) {
        console.error('Error zooming out on leaflet map:', err);
      }
    }
  };

  const handleResetView = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      resetCamera(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setView([0, 0], 2);
      } catch (err) {
        console.error('Error resetting leaflet map view:', err);
      }
    }
  };

  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(tool === activeTool ? null : tool);
  };

  const requestClearAll = () => {
    setIsClearDialogOpen(true);
  };

  const handleClearAll = () => {
    if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        const layers = leafletMapRef.current._layers;
        if (layers) {
          Object.keys(layers).forEach(layerId => {
            const layer = layers[layerId];
            if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
              leafletMapRef.current.removeLayer(layer);
            }
          });
        }
        
        // Clear any SVG paths
        window.dispatchEvent(new CustomEvent('clearAllSvgPaths'));
        
        // Clear any markers from storage
        localStorage.removeItem('savedMarkers');
        localStorage.removeItem('savedDrawings');
        localStorage.removeItem('svgPaths');
        
        // Notify components
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('markersUpdated'));
        window.dispatchEvent(new Event('drawingsUpdated'));
        
        toast({
          title: "Map Cleared",
          description: "All drawings and markers have been removed from the map.",
        });
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
      
      setIsClearDialogOpen(false);
    }
  };

  const handleCancelClear = () => {
    setIsClearDialogOpen(false);
  };

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <MapViews
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
        
        <DrawingTools 
          onToolSelect={handleToolSelect}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
          onClearAll={requestClearAll}
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
      
      <div 
        className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
        style={{ 
          maxWidth: '400px',
        }}
      >
        <LocationSearch onLocationSelect={onLocationSelect} />
      </div>
      
      <ConfirmationDialog
        isOpen={isClearDialogOpen}
        title="Clear All Map Data"
        description="Are you sure you want to clear all drawings and markers from the map? This action cannot be undone."
        onConfirm={handleClearAll}
        onCancel={handleCancelClear}
      />
    </div>
  );
};

export default MapContentContainer;
