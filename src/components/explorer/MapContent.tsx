
import React, { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import MapContentContainer from './map/MapContentContainer';
import { forceMapRefresh } from '@/utils/clear-operations/map-refresh';

interface MapContentProps {
  currentView: 'cesium' | 'leaflet';
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  onLocationSelect: (location: Location) => void;
  flyCompleted?: boolean;
}

const MapContent = (props: MapContentProps) => {
  const { selectedLocation, currentView } = props;
  
  // Add effect to force map refresh when location or view changes
  useEffect(() => {
    if (selectedLocation) {
      console.log(`MapContent: Location selected in ${currentView} view:`, selectedLocation.label);
      // Small delay to ensure the map is ready before attempting to navigate
      setTimeout(() => {
        forceMapRefresh();
        
        // Emit a custom event to signal that a location has been selected
        window.dispatchEvent(new CustomEvent('locationSelected', {
          detail: {
            location: selectedLocation,
            view: currentView
          }
        }));
      }, 500); // Increased delay for better stability
    }
  }, [selectedLocation, currentView]);

  return <MapContentContainer {...props} />;
};

export default MapContent;
