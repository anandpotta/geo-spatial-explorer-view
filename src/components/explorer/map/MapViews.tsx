
import React, { useState, useEffect } from 'react';
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
  // Add transition state to handle smoother view changes
  const [transitioning, setTransitioning] = useState(false);
  const [previousView, setPreviousView] = useState<'cesium' | 'leaflet' | null>(null);
  
  // Handle view transitions
  useEffect(() => {
    if (previousView && previousView !== currentView) {
      // Start transition effect
      setTransitioning(true);
      
      // End transition after animation completes
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, 500); // Match this to the CSS transition duration
      
      return () => clearTimeout(timer);
    }
    
    setPreviousView(currentView);
  }, [currentView, previousView]);
  
  return (
    <>
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          currentView === 'cesium' 
            ? 'opacity-100 z-10' 
            : transitioning 
              ? 'opacity-0 z-10 pointer-events-none' 
              : 'opacity-0 z-0 pointer-events-none'
        }`} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          width: '100%', 
          height: '100%',
          visibility: currentView === 'cesium' || transitioning ? 'visible' : 'hidden',
          transform: currentView === 'cesium' ? 'scale(1)' : 'scale(0.98)'
        }}
        data-map-type="cesium"
      >
        {/* Always render both views but hide one */}
        <CesiumMap 
          selectedLocation={selectedLocation}
          onMapReady={onMapReady}
          onFlyComplete={onFlyComplete}
          cinematicFlight={true}
          key={`cesium-${mapKey}`}
          onViewerReady={handleCesiumViewerRef}
        />
      </div>
      
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          currentView === 'leaflet' 
            ? 'opacity-100 z-10' 
            : transitioning 
              ? 'opacity-0 z-10 pointer-events-none' 
              : 'opacity-0 z-0 pointer-events-none'
        }`}
        style={{ 
          visibility: currentView === 'leaflet' || transitioning ? 'visible' : 'hidden',
          transform: currentView === 'leaflet' ? 'scale(1)' : 'scale(0.98)'
        }}
        data-map-type="leaflet"
      >
        {/* Always render both views but hide one */}
        <LeafletMap 
          selectedLocation={selectedLocation} 
          onMapReady={handleLeafletMapRef}
          activeTool={activeTool}
          key={`leaflet-${mapKey}`}
          onClearAll={handleClearAll}
        />
      </div>
      
      {/* Add transition overlay */}
      {transitioning && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-30 z-20 pointer-events-none transition-opacity duration-300"
          style={{
            animation: 'fadeInOut 500ms ease-in-out forwards'
          }}
        />
      )}
    </>
  );
};

export default MapViews;
