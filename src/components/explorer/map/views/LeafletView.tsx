
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
  
  // Reset the key when leaflet becomes active view to ensure fresh mounting
  useEffect(() => {
    if (currentView === 'leaflet' && !mapMountedRef.current) {
      mapMountedRef.current = true;
      mapReadyCalledRef.current = false;
      console.log("Leaflet is now the active view, ensuring fresh initialization");
      // Add a timestamp to ensure the key is truly unique
      setLocalKey(`${leafletKey}-${Date.now()}`);
      
      // Clear any existing ready timer
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
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
      readyTimerRef.current = setTimeout(() => {
        mapReadyCalledRef.current = true;
        onMapReady(map);
        readyTimerRef.current = null;
      }, 300);
    } else {
      // For preloaded maps, still mark as ready but don't delay
      mapReadyCalledRef.current = true;
      onMapReady(map);
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
