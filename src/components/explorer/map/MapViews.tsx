
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
  
  // Generate truly unique IDs for each view type that change with the mapKey
  // This ensures no container ID conflicts between renders
  const [uniqueLeafletKey] = useState<string>(`leaflet-${mapKey}-${createUniqueMapId()}`);
  const [uniqueCesiumKey] = useState<string>(`cesium-${mapKey}-${createUniqueMapId()}`);
  const currentViewRef = useRef<string>(currentView);
  const previousViewRef = useRef<string | null>(null);
  
  // Track view changes to handle transitions properly
  useEffect(() => {
    // When the view changes, mark previous map containers as inactive
    if (currentView !== currentViewRef.current) {
      console.log(`View changing from ${currentViewRef.current} to ${currentView}`);
      
      // Store the previous view before updating the current view reference
      previousViewRef.current = currentViewRef.current;
      
      // Set a timeout to perform cleanup after the new view has mounted
      setTimeout(() => {
        // Find and mark containers from the previous view as inactive
        document.querySelectorAll(`div[data-active="true"][data-container-type="leaflet-map"]`).forEach(el => {
          // Only mark as inactive if it's not from the current view
          if (currentView !== 'leaflet') {
            el.setAttribute('data-active', 'false');
            el.setAttribute('data-inactive', 'true');
            el.setAttribute('data-removed-at', Date.now().toString());
          }
        });
      }, 100);
      
      currentViewRef.current = currentView;
    }
  }, [currentView]);
  
  // Clean up any orphaned Leaflet elements when view changes or component unmounts
  useEffect(() => {
    // Mark any existing markers as stale
    document.querySelectorAll('.leaflet-marker-icon:not([data-stale="true"])').forEach(el => {
      el.setAttribute('data-stale', 'true');
    });
    
    document.querySelectorAll('.leaflet-marker-shadow:not([data-stale="true"])').forEach(el => {
      el.setAttribute('data-stale', 'true');
    });
    
    // Clean up all containers when the component unmounts
    return () => {
      // Only run cleanup on unmount, not during initial render
      setTimeout(() => {
        // Dispatch a cleanup event that other components can listen for
        window.dispatchEvent(new CustomEvent('mapViewCleanup', {
          detail: { previousView: previousViewRef.current }
        }));
        
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
        <div key={uniqueCesiumKey} className="w-full h-full" data-view-type="cesium" data-container-id={uniqueCesiumKey}>
          <ThreeGlobeMap
            selectedLocation={selectedLocation}
            onViewerReady={handleCesiumViewerRef}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
          />
        </div>
      )}
      
      {currentView === 'leaflet' && (
        <div key={uniqueLeafletKey} className="w-full h-full" data-view-type="leaflet" data-container-id={uniqueLeafletKey}>
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
