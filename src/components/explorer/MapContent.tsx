
import React, { useRef, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../CesiumMap';
import LeafletMap from '../LeafletMap';
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
    setActiveTool(tool);
    
    // Different handling based on the current active map
    if (currentView === 'cesium') {
      // Handle Cesium drawing tools
      if (tool === 'clear') {
        // Clear all drawings in Cesium
        toast.info('Clearing all shapes');
      }
    } else if (currentView === 'leaflet') {
      // Leaflet drawing tools are handled directly in the LeafletMap component
      if (tool === 'clear' && leafletMapRef.current) {
        // Clear all drawings in Leaflet
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

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        {/* Cesium view - improved z-index and visibility */}
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
          <CesiumMap 
            selectedLocation={selectedLocation}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
            cinematicFlight={true}
            key="cesium-map-instance"
            onViewerReady={handleCesiumViewerRef}
          />
        </div>
        
        {/* Leaflet view - proper z-index for visibility when active */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${currentView === 'leaflet' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
          style={{ 
            visibility: currentView === 'leaflet' ? 'visible' : 'hidden' 
          }}
          data-map-type="leaflet"
        >
          <LeafletMap 
            selectedLocation={selectedLocation} 
            onMapReady={handleLeafletMapRef}
          />
        </div>
        
        {/* Drawing Tools - rendered outside map containers for consistent visibility */}
        <DrawingTools 
          onToolSelect={handleToolSelect}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
        />
      </div>
      
      {/* Search bar with increased z-index to be above both maps */}
      <div 
        className="absolute top-4 left-4 right-4" 
        style={{ 
          zIndex: 20000,
          position: 'relative'
        }}
      >
        <LocationSearch onLocationSelect={onLocationSelect} />
      </div>
    </div>
  );
};

export default MapContent;
