
import React from 'react';
import { Location } from '@/utils/geo-utils';
import LeafletMap from '../../map/LeafletMap';
import CesiumView from '../../map/CesiumMapLoading';
import ThreeGlobeMap from '../../map/ThreeGlobeMap';

interface MapViewsProps {
  currentView: 'cesium' | 'leaflet';
  mapKey: number;
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
  handleCesiumViewerRef?: (viewer: any) => void;
  handleLeafletMapRef?: (map: any) => void;
  activeTool?: string | null;
  handleClearAll?: () => void;
  stayAtCurrentPosition?: boolean;
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
  handleClearAll,
  stayAtCurrentPosition = false
}) => {
  return (
    <>
      {currentView === 'cesium' && (
        <div key={`cesium-${mapKey}`} className="w-full h-full">
          <ThreeGlobeMap
            selectedLocation={selectedLocation}
            onViewerReady={handleCesiumViewerRef}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
          />
        </div>
      )}
      
      {currentView === 'leaflet' && (
        <div key={`leaflet-${mapKey}`} className="w-full h-full">
          <LeafletMap 
            selectedLocation={selectedLocation}
            onMapReady={handleLeafletMapRef}
            activeTool={activeTool}
            onClearAll={handleClearAll}
            stayAtCurrentPosition={stayAtCurrentPosition}
          />
        </div>
      )}
    </>
  );
};

export default MapViews;
