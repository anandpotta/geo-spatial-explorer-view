
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
  viewTransitionReady?: boolean;
}

const MapContentContainer: React.FC<MapContentContainerProps> = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect,
  viewTransitionReady = true
}) => {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const previousViewRef = useRef<string | null>(null);
  
  // Reset map instance when view changes
  useEffect(() => {
    // Only regenerate key when view type actually changes
    if (previousViewRef.current !== currentView) {
      console.log(`View changed from ${previousViewRef.current} to ${currentView}, regenerating map key`);
      
      // Only regenerate the key if the transition is ready to avoid double-loading
      if (viewTransitionReady) {
        setMapKey(Date.now());
      }
      
      previousViewRef.current = currentView;
      
      // Set transition flag
      setViewTransitionInProgress(true);
      const timer = setTimeout(() => {
        setViewTransitionInProgress(false);
        setMapReady(false);
      }, 800); // Slightly shorter for smoother transition
      
      return () => clearTimeout(timer);
    }
  }, [currentView, viewTransitionReady]);

  const handleCesiumViewerRef = (viewer: any) => {
    // Only update if not already set or explicitly changing views
    if (!cesiumViewerRef.current || previousViewRef.current !== 'cesium') {
      console.log('Setting Cesium viewer reference');
      cesiumViewerRef.current = viewer;
      
      if (currentView === 'cesium') {
        setTimeout(() => {
          setMapReady(true);
          
          // When 3D globe is ready after transition, notify user with less invasive toast
          if (!viewTransitionInProgress) {
            toast({
              title: "3D Globe Ready",
              description: "Interactive 3D globe view has been loaded.",
              variant: "default",
              duration: 2000,
            });
          }
        }, 300);
      }
    }
  };

  const handleLeafletMapRef = (map: any) => {
    // Only update if not already set or explicitly changing views
    if (!leafletMapRef.current || previousViewRef.current !== 'leaflet') {
      console.log('Setting Leaflet map reference');
      leafletMapRef.current = map;
      
      // When Leaflet map is ready after transition, notify user
      if (currentView === 'leaflet' && !viewTransitionInProgress) {
        setTimeout(() => {
          setMapReady(true);
          
          // Less invasive toast during transitions
          if (selectedLocation) {
            toast({
              title: "Map View Ready",
              description: `Showing ${selectedLocation.label}`,
              variant: "default",
              duration: 2000,
            });
          } else {
            toast({
              title: "Map View Ready",
              variant: "default",
              duration: 1500,
            });
          }
        }, 300);
      }
    }
  };

  const handleMapReadyInternal = () => {
    setMapReady(true);
    onMapReady();
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
          onMapReady={handleMapReadyInternal}
          onFlyComplete={onFlyComplete}
          handleCesiumViewerRef={handleCesiumViewerRef}
          handleLeafletMapRef={handleLeafletMapRef}
          activeTool={activeTool}
          handleClearAll={handleClearAll}
          viewTransitionReady={viewTransitionReady}
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
      </div>
      
      <div 
        className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
        style={{ 
          maxWidth: '400px',
        }}
      >
        <LocationSearch onLocationSelect={onLocationSelect} />
      </div>
      
      {/* Transition overlay that appears only during view transitions */}
      {viewTransitionInProgress && !viewTransitionReady && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-30 z-50 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: viewTransitionInProgress ? 0.3 : 0,
          }}
        />
      )}
    </div>
  );
};

export default MapContentContainer;
