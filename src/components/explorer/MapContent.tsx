
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
}

const MapContent = ({ 
  currentView, 
  selectedLocation, 
  onMapReady, 
  onFlyComplete 
}: MapContentProps) => {
  return (
    <div className="flex-1 relative">
      {/* The actual search component positioned absolutely on top of the map */}
      <LocationSearch onLocationSelect={(location) => {}} />
      
      {/* Map container */}
      <div className="w-full h-full relative">
        {currentView === 'cesium' && (
          <CesiumMap 
            selectedLocation={selectedLocation}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
          />
        )}
        
        {currentView === 'leaflet' && selectedLocation && (
          <LeafletMap selectedLocation={selectedLocation} />
        )}
        
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
