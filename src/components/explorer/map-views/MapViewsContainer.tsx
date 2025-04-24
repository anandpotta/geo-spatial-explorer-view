
import React from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '@/components/CesiumMap';
import LeafletMap from '@/components/map/LeafletMap';
import GlobeView from '@/components/globe/GlobeView';

interface MapViewsContainerProps {
  currentView: 'cesium' | 'leaflet' | 'globe';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
  isTransitioning: boolean;
  activeTool?: string | null;
}

const MapViewsContainer = ({
  currentView,
  selectedLocation,
  onMapReady,
  onFlyComplete,
  onLocationSelect,
  isTransitioning,
  activeTool
}: MapViewsContainerProps) => {
  const getViewClasses = (viewType: string) => {
    const baseClasses = "absolute inset-0 transition-opacity duration-500";
    return currentView === viewType 
      ? `${baseClasses} opacity-100 z-10`
      : `${baseClasses} opacity-0 z-0 pointer-events-none`;
  };

  return (
    <>
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
        />
      </div>
      
      <div 
        className={getViewClasses('leaflet')}
        style={{ visibility: currentView === 'leaflet' ? 'visible' : 'hidden' }}
        data-map-type="leaflet"
      >
        <LeafletMap 
          selectedLocation={selectedLocation} 
          onLocationSelect={onLocationSelect}
          activeTool={activeTool}
        />
      </div>

      <div 
        className={getViewClasses('globe')}
        style={{ visibility: currentView === 'globe' ? 'visible' : 'hidden' }}
        data-map-type="globe"
      >
        <GlobeView 
          onLocationSelect={onLocationSelect}
          key={`globe-view-${currentView === 'globe' ? 'active' : 'inactive'}`}
        />
      </div>
    </>
  );
};

export default MapViewsContainer;
