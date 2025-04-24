
import React, { useState } from 'react';
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
  // Add state to track the active drawing tool
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Handle map drawing tool selection
  const handleToolSelect = (tool: string) => {
    setActiveTool(tool === activeTool ? null : tool);
  };

  // Simple map control handlers
  const handleZoomIn = () => {
    // This will be handled by the appropriate map component
    const mapElement = document.querySelector(`[data-map-type="${currentView}"]`);
    if (mapElement) {
      const zoomInEvent = new CustomEvent('map:zoomIn');
      mapElement.dispatchEvent(zoomInEvent);
    }
  };

  const handleZoomOut = () => {
    const mapElement = document.querySelector(`[data-map-type="${currentView}"]`);
    if (mapElement) {
      const zoomOutEvent = new CustomEvent('map:zoomOut');
      mapElement.dispatchEvent(zoomOutEvent);
    }
  };

  const handleResetView = () => {
    const mapElement = document.querySelector(`[data-map-type="${currentView}"]`);
    if (mapElement) {
      const resetEvent = new CustomEvent('map:reset');
      mapElement.dispatchEvent(resetEvent);
    }
  };

  // Handle clearing all map layers
  const handleClearAll = () => {
    const mapElement = document.querySelector(`[data-map-type="${currentView}"]`);
    if (mapElement) {
      const clearEvent = new CustomEvent('map:clearAll');
      mapElement.dispatchEvent(clearEvent);
    }
  };

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
          activeTool={activeTool}
        />
        
        {!isTransitioning && (
          <DrawingTools 
            onToolSelect={handleToolSelect}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetView}
            onClearAll={handleClearAll}
          />
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
