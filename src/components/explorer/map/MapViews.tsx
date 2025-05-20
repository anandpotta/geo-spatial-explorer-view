
import React, { useRef, useEffect, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import LeafletMap from '../../map/LeafletMap';
import CesiumView from '../../map/CesiumMapLoading';
import ThreeGlobeMap from '../../map/ThreeGlobeMap';
import { createUniqueMapId } from '@/utils/leaflet-type-utils';

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
  
  // Generate truly unique IDs for each view type using our utility function
  const [uniqueLeafletKey] = useState<string>(createUniqueMapId());
  const [uniqueCesiumKey] = useState<string>(createUniqueMapId());
  
  // Clean up any orphaned Leaflet elements when view changes or component unmounts
  useEffect(() => {
    // Mark any existing markers as stale
    document.querySelectorAll('.leaflet-marker-icon:not([data-stale="true"])').forEach(el => {
      el.setAttribute('data-stale', 'true');
    });
    
    document.querySelectorAll('.leaflet-marker-shadow:not([data-stale="true"])').forEach(el => {
      el.setAttribute('data-stale', 'true');
    });
    
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
        <div key={uniqueCesiumKey} className="w-full h-full">
          <ThreeGlobeMap
            selectedLocation={selectedLocation}
            onViewerReady={handleCesiumViewerRef}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
          />
        </div>
      )}
      
      {currentView === 'leaflet' && (
        <div key={uniqueLeafletKey} className="w-full h-full">
          <LeafletMap 
            selectedLocation={selectedLocation}
            onMapReady={handleLeafletMapRef}
            activeTool={activeTool}
            onClearAll={handleClearAll}
            stayAtCurrentPosition={stayAtCurrentPosition}
            mapInstanceKey={uniqueLeafletKey} // Pass unique key to prevent reuse
          />
        </div>
      )}
    </>
  );
};

export default MapViews;
