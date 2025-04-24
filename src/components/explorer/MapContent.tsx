
import React, { useRef, useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../CesiumMap';
import LeafletMap from '../map/LeafletMap';
import GlobeView from '../globe/GlobeView';
import DrawingTools from '../DrawingTools';
import LocationSearch from '../LocationSearch';
import { zoomIn, zoomOut, resetCamera } from '@/utils/cesium-camera';
import { toast } from 'sonner';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet' | 'globe';
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
  
  // Reset map instance when view changes
  useEffect(() => {
    setMapKey(Date.now());
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

  // Handle globe location selection
  const handleGlobeLocationSelect = (coords) => {
    if (coords) {
      const location: Location = {
        id: `globe-${Date.now()}`,
        label: `Selected location on Globe`,
        x: coords.longitude,
        y: coords.latitude,
      };
      onLocationSelect(location);
    }
  };

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        {/* Cesium Map */}
        {currentView === 'cesium' && (
          <div 
            className="absolute inset-0 transition-opacity duration-500 opacity-100 z-10"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              width: '100%', 
              height: '100%',
              visibility: 'visible'
            }}
            data-map-type="cesium"
          >
            <CesiumMap 
              selectedLocation={selectedLocation}
              onMapReady={onMapReady}
              onFlyComplete={onFlyComplete}
              cinematicFlight={true}
              key={`cesium-${mapKey}`}
              onViewerReady={handleCesiumViewerRef}
            />
          </div>
        )}
        
        {/* Leaflet Map */}
        {currentView === 'leaflet' && (
          <div 
            className="absolute inset-0 transition-opacity duration-500 opacity-100 z-10"
            style={{ visibility: 'visible' }}
            data-map-type="leaflet"
          >
            <LeafletMap 
              selectedLocation={selectedLocation} 
              onMapReady={handleLeafletMapRef}
              activeTool={activeTool}
              key={`leaflet-${mapKey}`}
              onLocationSelect={onLocationSelect}
            />
          </div>
        )}

        {/* Globe View */}
        {currentView === 'globe' && (
          <div 
            className="absolute inset-0 transition-opacity duration-500 opacity-100 z-10"
            style={{ visibility: 'visible' }}
            data-map-type="globe"
          >
            <GlobeView 
              key={`globe-${mapKey}`}
              onLocationSelect={handleGlobeLocationSelect}
            />
          </div>
        )}
        
        <DrawingTools 
          onToolSelect={handleToolSelect}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
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
