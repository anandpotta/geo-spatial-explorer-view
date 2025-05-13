import React, { useRef, useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import DrawingTools from '../../DrawingTools';
import LocationSearch from '../../LocationSearch';
import { zoomIn, zoomOut, resetCamera } from '@/utils/threejs-camera';
import MapViews from './MapViews';
import MapTools from './MapTools';
import DrawingToolHandler from './DrawingToolHandler';
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
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const [isViewSwitchingAllowed, setIsViewSwitchingAllowed] = useState(true);
  
  // Reset map instance when view changes
  useEffect(() => {
    setMapKey(Date.now());
    
    // Set transition flag
    setViewTransitionInProgress(true);
    const timer = setTimeout(() => {
      setViewTransitionInProgress(false);
    }, 1000); // Allow time for transition to complete
    
    // Temporarily prevent rapid view switching
    setIsViewSwitchingAllowed(false);
    const switchTimer = setTimeout(() => {
      setIsViewSwitchingAllowed(true);
    }, 1500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(switchTimer);
    };
  }, [currentView]);

  const handleCesiumViewerRef = (viewer: any) => {
    // Only update the ref if it's not already set (prevents duplicate init)
    if (!cesiumViewerRef.current) {
      console.log('Setting Cesium viewer reference');
      cesiumViewerRef.current = viewer;
    }
  };

  const handleLeafletMapRef = (map: any) => {
    // Only update the ref if it's not already set (prevents duplicate init)
    if (!leafletMapRef.current) {
      console.log('Setting Leaflet map reference');
      leafletMapRef.current = map;
      
      // When Leaflet map is ready after transition, notify user
      if (currentView === 'leaflet' && !viewTransitionInProgress) {
        toast({
          title: "Map View Ready",
          description: "Tiled map view has been loaded successfully.",
          variant: "default",
        });
      }
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
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
    }
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
