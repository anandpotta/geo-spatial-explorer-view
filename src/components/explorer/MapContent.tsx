
import React from 'react';
import { Location } from '@/utils/geo-utils';
import DrawingTools from '@/components/DrawingTools';
import MapViewsContainer from './map-views/MapViewsContainer';
import SearchContainer from './search/SearchContainer';
import TransitionOverlay from './transitions/TransitionOverlay';

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
  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <MapViewsContainer 
          currentView={currentView}
          selectedLocation={selectedLocation}
          onMapReady={onMapReady}
          onFlyComplete={onFlyComplete}
          onLocationSelect={onLocationSelect}
          isTransitioning={isTransitioning}
        />
        
        {!isTransitioning && (
          <DrawingTools />
        )}
      </div>
      
      <SearchContainer 
        isTransitioning={isTransitioning}
        onLocationSelect={onLocationSelect}
      />
      
      <TransitionOverlay isTransitioning={isTransitioning} />
    </div>
  );
};

export default MapContent;
