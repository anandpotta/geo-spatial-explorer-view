
import React, { useEffect, useRef } from 'react';
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
  
  // When view changes to Leaflet, ensure map gets proper initialization signal
  useEffect(() => {
    if (currentView === 'leaflet' && !mapMountedRef.current) {
      console.log("Leaflet is now the active view");
      mapMountedRef.current = true;
    }
  }, [currentView]);

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
            onMapReady={(map) => {
              console.log("LeafletMap ready callback triggered");
              onMapReady(map);
            }}
            activeTool={currentView === 'leaflet' ? activeTool : null}
            key={`${leafletKey}-${currentView === 'leaflet' ? 'active' : 'inactive'}`}
            onClearAll={onClearAll}
            preload={currentView !== 'leaflet'}
          />
          
          {selectedLocation && onClearLocation && (
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
