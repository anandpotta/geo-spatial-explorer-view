
import React, { useRef, useEffect } from 'react';
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
  console.log("MapViews rendering with stayAtCurrentPosition:", stayAtCurrentPosition);
  
  // Create unique IDs for each view type to ensure we don't reuse containers
  const leafletKeyRef = useRef<string>(`leaflet-${mapKey}-${Date.now()}`);
  const cesiumKeyRef = useRef<string>(`cesium-${mapKey}-${Date.now()}`);
  
  // Clean up any orphaned Leaflet elements when view changes or component unmounts
  useEffect(() => {
    return () => {
      // Only run cleanup on unmount, not during initial render
      setTimeout(() => {
        // Clean up any orphaned markers when view changes
        document.querySelectorAll('.leaflet-marker-icon[data-stale="true"]').forEach(el => {
          el.remove();
        });
        
        document.querySelectorAll('.leaflet-marker-shadow[data-stale="true"]').forEach(el => {
          el.remove();
        });
      }, 300);
    };
  }, [currentView]);
  
  return (
    <>
      {currentView === 'cesium' && (
        <div key={cesiumKeyRef.current} className="w-full h-full">
          <ThreeGlobeMap
            selectedLocation={selectedLocation}
            onViewerReady={handleCesiumViewerRef}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
          />
        </div>
      )}
      
      {currentView === 'leaflet' && (
        <div key={leafletKeyRef.current} className="w-full h-full">
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
