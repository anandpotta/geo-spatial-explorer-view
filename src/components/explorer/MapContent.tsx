import React, { useRef, useState } from 'react';
import { Location } from '@/utils/location/types';
import CesiumMap from '../CesiumMap';
import LeafletMap from '../LeafletMap';
import DrawingTools from '../DrawingTools';
import LocationSearch from '../LocationSearch';
import { zoomIn, zoomOut, resetCamera } from '@/utils/cesium-camera';
import { toast } from 'sonner';
import LocationDropdown from '../map/LocationDropdown';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  selectedBuildingId?: string | null;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
}

const MapContent = ({ 
  currentView, 
  selectedLocation, 
  selectedBuildingId,
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
    setActiveTool(prev => prev === tool ? null : tool);
  };

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
          <CesiumMap 
            selectedLocation={selectedLocation}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
            cinematicFlight={true}
            key="cesium-map-instance"
            onViewerReady={handleCesiumViewerRef}
          />
        </div>
        
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
            activeTool={activeTool}
            selectedBuildingId={selectedBuildingId}
          />
        </div>
        
        <DrawingTools 
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
        />

        {currentView === 'leaflet' && (
          <div className="absolute right-4 top-20 z-[10000] flex flex-col gap-4">
            <LocationDropdown 
              onSelect={(building) => {
                if (onLocationSelect) {
                  onLocationSelect({
                    id: building.location.id,
                    label: building.name,
                    x: building.location.x,
                    y: building.location.y
                  });
                }
              }}
            />
          </div>
        )}
      </div>
      
      <div 
        className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
        style={{ maxWidth: '400px' }}
      >
        <LocationSearch onLocationSelect={onLocationSelect} />
      </div>
    </div>
  );
};

export default MapContent;
