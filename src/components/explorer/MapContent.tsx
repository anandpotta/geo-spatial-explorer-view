
import React, { useRef, useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../CesiumMap';
import LeafletMap from '../map/LeafletMap';
import DrawingTools from '../DrawingTools';
import LocationSearch from '../LocationSearch';
import { zoomIn, zoomOut, resetCamera } from '@/utils/cesium-camera';
import { toast } from 'sonner';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
}

const MapContent = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect 
}: MapContentProps) => {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const prevViewRef = useRef<string>(currentView);
  
  // Reset map instance when view changes
  useEffect(() => {
    if (prevViewRef.current !== currentView) {
      console.log(`View changed from ${prevViewRef.current} to ${currentView}, forcing remount`);
      setMapKey(Date.now());
      prevViewRef.current = currentView;
    }
  }, [currentView]);

  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };

  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
  };

  const handleZoomIn = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomIn(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomOut(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      resetCamera(cesiumViewerRef.current);
      toast.info('View reset');
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.setView([51.505, -0.09], 13);
      toast.info('View reset');
    }
  };

  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(tool === activeTool ? null : tool);
    
    if (currentView === 'cesium') {
      if (tool === 'clear') {
        toast.info('Clearing all shapes');
      }
    } else if (currentView === 'leaflet') {
      if (tool === 'clear' && leafletMapRef.current) {
        const layers = leafletMapRef.current._layers;
        if (layers) {
          Object.keys(layers).forEach(layerId => {
            const layer = layers[layerId];
            if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
              leafletMapRef.current.removeLayer(layer);
            }
          });
          toast.info('All shapes cleared');
        }
      }
    }
  };

  const handleClearAll = () => {
    if (currentView === 'leaflet' && leafletMapRef.current) {
      // Clear all layers in Leaflet map
      const layers = leafletMapRef.current._layers;
      if (layers) {
        Object.keys(layers).forEach(layerId => {
          const layer = layers[layerId];
          if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
            leafletMapRef.current.removeLayer(layer);
          }
        });
        toast.info('All shapes cleared');
      }
    }
  };

  const leafletKey = `leaflet-${mapKey}-${currentView === 'leaflet' ? 'active' : 'inactive'}`;
  const cesiumKey = `cesium-${mapKey}-${currentView === 'cesium' ? 'active' : 'inactive'}`;

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${currentView === 'cesium' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: '100%', 
            height: '100%',
            visibility: currentView === 'cesium' ? 'visible' : 'hidden'
          }}
          data-map-type="cesium"
        >
          {currentView === 'cesium' && (
            <CesiumMap 
              selectedLocation={selectedLocation}
              onMapReady={onMapReady}
              onFlyComplete={onFlyComplete}
              cinematicFlight={true}
              key={cesiumKey}
              onViewerReady={handleCesiumViewerRef}
            />
          )}
        </div>
        
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${currentView === 'leaflet' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
          style={{ 
            visibility: currentView === 'leaflet' ? 'visible' : 'hidden' 
          }}
          data-map-type="leaflet"
        >
          {currentView === 'leaflet' && (
            <LeafletMap 
              selectedLocation={selectedLocation} 
              onMapReady={handleLeafletMapRef}
              activeTool={activeTool}
              key={leafletKey}
              onClearAll={handleClearAll}
            />
          )}
        </div>
        
        <DrawingTools 
          onToolSelect={handleToolSelect}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
          onClearAll={handleClearAll}
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

export default MapContent;
