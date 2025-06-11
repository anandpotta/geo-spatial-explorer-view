
import React from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../../CesiumMap'; // Now using Three.js inside
import LeafletMap from '../../map/LeafletMap';

interface MapViewsProps {
  currentView: 'cesium' | 'leaflet';
  mapKey: number;
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  handleCesiumViewerRef: (viewer: any) => void;
  handleLeafletMapRef: (map: any) => void;
  activeTool: string | null;
  handleClearAll: () => void;
}

const MapViews: React.FC<MapViewsProps> = ({
  currentView,
  mapKey,
  selectedLocation,
  onMapReady,
  onFlyComplete,
  handleCesiumViewerRef,
  handleLeafletMapRef,
  activeTool,
  handleClearAll
}) => {
  return (
    <>
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
            key={`cesium-${mapKey}`}
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
            activeTool={activeTool}
            key={`leaflet-${mapKey}`}
            onClearAll={handleClearAll}
          />
        )}
      </div>
    </>
  );
};

export default MapViews;
