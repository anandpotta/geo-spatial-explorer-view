
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
  isTransitioning?: boolean;
}

const MapContent = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onLocationSelect,
  isTransitioning = false
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

  // Determine CSS class based on transition state
  const getViewClasses = (viewType: string) => {
    const baseClasses = "absolute inset-0 transition-opacity duration-500";
    
    if (currentView === viewType) {
      return `${baseClasses} opacity-100 z-10`;
    }
    
    return `${baseClasses} opacity-0 z-0 pointer-events-none`;
  };

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        {/* Cesium Map - always render for smooth transitions */}
        <div 
          className={getViewClasses('cesium')}
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
          <CesiumMap 
            selectedLocation={selectedLocation}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
            cinematicFlight={true}
            key={`cesium-${mapKey}`}
            onViewerReady={handleCesiumViewerRef}
          />
        </div>
        
        {/* Leaflet Map - always render for smooth transitions */}
        <div 
          className={getViewClasses('leaflet')}
          style={{ 
            visibility: currentView === 'leaflet' ? 'visible' : 'hidden'
          }}
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

        {/* Globe View */}
        <div 
          className={getViewClasses('globe')}
          style={{ 
            visibility: currentView === 'globe' ? 'visible' : 'hidden'
          }}
          data-map-type="globe"
        >
          <GlobeView 
            key={`globe-${mapKey}`}
            onLocationSelect={handleGlobeLocationSelect}
          />
        </div>
        
        {!isTransitioning && (
          <DrawingTools 
            onToolSelect={handleToolSelect}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetView}
          />
        )}
      </div>
      
      <div 
        className="absolute top-4 left-0 right-0 z-[10000] mx-auto transition-opacity duration-300" 
        style={{ 
          maxWidth: '400px',
          opacity: isTransitioning ? 0.6 : 1,
          pointerEvents: isTransitioning ? 'none' : 'auto'
        }}
      >
        <LocationSearch onLocationSelect={onLocationSelect} />
      </div>
      
      {isTransitioning && (
        <div className="absolute inset-0 flex items-center justify-center z-[10002] pointer-events-none">
          <div className="bg-background/70 rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-lg font-semibold text-primary">Traveling to destination...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContent;
