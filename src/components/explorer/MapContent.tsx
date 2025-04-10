
import React from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../CesiumMap';
import LeafletMap from '../LeafletMap';
import DrawingTools from '../DrawingTools';
import LocationSearch from '../LocationSearch';

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
  return (
    <div className="flex-1 relative w-full h-full overflow-hidden">
      {/* The actual search component positioned absolutely on top of the map */}
      <LocationSearch onLocationSelect={onLocationSelect} />
      
      {/* Map container with responsive dimensions */}
      <div className="relative w-full h-full">
        <div className={`absolute inset-0 transition-opacity duration-500 ${currentView === 'cesium' ? 'opacity-100 z-10' : 'opacity-0 -z-10'}`}>
          <CesiumMap 
            selectedLocation={selectedLocation}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
            cinematicFlight={true}
          />
        </div>
        
        <div className={`absolute inset-0 transition-opacity duration-500 ${currentView === 'leaflet' ? 'opacity-100 z-10' : 'opacity-0 -z-10'}`}>
          <LeafletMap selectedLocation={selectedLocation} />
        </div>
        
        {/* Drawing tools displayed only in leaflet view */}
        {currentView === 'leaflet' && (
          <DrawingTools 
            onToolSelect={(tool) => console.log('Selected tool:', tool)}
            onZoomIn={() => console.log('Zoom in')}
            onZoomOut={() => console.log('Zoom out')}
            onReset={() => console.log('Reset view')}
          />
        )}
      </div>
    </div>
  );
};

export default MapContent;
