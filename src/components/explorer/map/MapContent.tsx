
import React, { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import MapContentContainer from './MapContentContainer';
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
      const timeout = setTimeout(() => {
        try {
          forceMapRefresh();
          
          // Emit a custom event to signal that a location has been selected
          window.dispatchEvent(new CustomEvent('locationSelected', {
            detail: {
              location: selectedLocation,
              view: currentView
            }
          }));
        } catch (error) {
          console.error("Error refreshing map after location selection:", error);
        }
      }, 700); // Increased delay for better stability
      
      return () => clearTimeout(timeout);
    }
  }, [selectedLocation, currentView]);

  return <MapContentContainer {...props} />;
};

export default MapContent;
