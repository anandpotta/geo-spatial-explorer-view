
import React from 'react';
import LeafletMap from '@/components/map/LeafletMap';
import { Location } from '@/utils/geo-utils';
import { getLeafletStyles } from './ViewTransitionStyles';

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
  fadeIn
}) => {
  const styles = getLeafletStyles(currentView, transitioning, preloadedLeaflet);
  const shouldRender = currentView === 'leaflet' || transitioning || preloadedLeaflet;
  const fadeInClass = fadeIn && currentView === 'leaflet' ? 'animate-fade-in' : '';

  return (
    <div 
      className={`absolute inset-0 transition-all duration-300 ease-in-out ${fadeInClass}`}
      style={styles}
      data-map-type="leaflet"
    >
      {shouldRender && (
        <LeafletMap 
          selectedLocation={selectedLocation} 
          onMapReady={onMapReady}
          activeTool={currentView === 'leaflet' ? activeTool : null}
          key={leafletKey}
          onClearAll={onClearAll}
          preload={currentView !== 'leaflet'}
        />
      )}
    </div>
  );
};

export default LeafletView;
