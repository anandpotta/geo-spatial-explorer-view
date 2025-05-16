
import React, { useEffect, useRef, useState } from 'react';
import LeafletMap from '@/components/map/LeafletMap';
import { Location } from '@/utils/geo-utils';
import { getLeafletStyles } from './ViewTransitionStyles';
import SelectedLocationDisplay from '../components/SelectedLocationDisplay';

interface LeafletViewProps {
  currentView: 'cesium' | 'leaflet';
  transitioning: boolean;
  preloadedLeaflet: boolean;
  selectedLocation?: Location;
  leafletKey: string;
  onMapReady: (map: any) => void;
  activeTool: string | null;
  onClearAll: () => void;
  fadeIn: boolean;
  onClearLocation?: () => void;
}

const LeafletView: React.FC<LeafletViewProps> = ({
  currentView,
  transitioning,
  preloadedLeaflet,
  selectedLocation,
  leafletKey,
  onMapReady,
  activeTool,
  onClearAll,
  fadeIn,
  onClearLocation
}) => {
  const styles = getLeafletStyles(currentView, transitioning, preloadedLeaflet);
  const shouldRender = currentView === 'leaflet' || transitioning || preloadedLeaflet;
  const fadeInClass = fadeIn && currentView === 'leaflet' ? 'animate-fade-in' : '';
  const isLeafletView = currentView === 'leaflet';
  const mapMountedRef = useRef(false);
  const mapReadyCalledRef = useRef(false);
  const [localKey, setLocalKey] = useState(leafletKey);
  const readyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveView = useRef(currentView === 'leaflet');
  
  // Track when leaflet becomes the active view
  useEffect(() => {
    isActiveView.current = currentView === 'leaflet';
    
    // Clear any existing ready timer first
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
    
    // Reset the key when leaflet becomes active view to ensure fresh mounting
    if (currentView === 'leaflet' && !mapMountedRef.current) {
      mapMountedRef.current = true;
      mapReadyCalledRef.current = false;
      console.log("Leaflet is now the active view, ensuring fresh initialization");
      // Add a timestamp to ensure the key is truly unique
      setLocalKey(`${leafletKey}-${Date.now()}`);
    }
    
    return () => {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
  }, [currentView, leafletKey]);
  
  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      mapMountedRef.current = false;
      mapReadyCalledRef.current = false;
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
  }, []);

  const handleMapReady = (map: any) => {
    if (mapReadyCalledRef.current) {
      console.log("Map ready already called, skipping duplicate");
      return;
    }
    
    console.log("LeafletMap ready callback triggered");
    
    // When transitioning from Cesium to Leaflet, add a small delay before calling onMapReady
    // This ensures the visual transition completes before map operations occur
    if (currentView === 'leaflet') {
      // Clear any existing timer to prevent leaks
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
      }
      
      // Set a new timer with increased delay for stability
      readyTimerRef.current = setTimeout(() => {
        if (!mapReadyCalledRef.current && isActiveView.current) {
          mapReadyCalledRef.current = true;
          console.log("Calling onMapReady with delay for transition stability");
          onMapReady(map);
        }
        readyTimerRef.current = null;
      }, 400);
    } else if (preloadedLeaflet) {
      // For preloaded maps, still mark as ready but don't trigger the callback
      mapReadyCalledRef.current = true;
      console.log("Map ready called for preloaded leaflet map (not triggering callback)");
    }
  };

  return (
    <div 
      className={`absolute inset-0 transition-all duration-300 ease-in-out ${fadeInClass}`}
      style={styles}
      data-map-type="leaflet"
      data-active={currentView === 'leaflet' ? 'true' : 'false'}
    >
      {shouldRender && (
        <>
          <LeafletMap 
            selectedLocation={selectedLocation} 
            onMapReady={handleMapReady}
            activeTool={currentView === 'leaflet' ? activeTool : null}
            key={localKey}
            onClearAll={onClearAll}
            preload={currentView !== 'leaflet'}
          />
          
          {selectedLocation && onClearLocation && isLeafletView && (
            <SelectedLocationDisplay 
              selectedLocation={selectedLocation}
              onClear={onClearLocation}
              isLeafletView={isLeafletView}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LeafletView;
