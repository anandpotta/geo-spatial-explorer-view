
import React, { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import SearchBox from './search/SearchBox';
import { LocationTagPortal } from './search/LocationTag';
import { useMarkerPosition } from './search/useMarkerPosition';
import { useMapContainer } from './search/useMapContainer';

interface MapSearchOverlayProps {
  onLocationSelect: (location: Location) => void;
  flyCompleted?: boolean;
}

const MapSearchOverlay: React.FC<MapSearchOverlayProps> = ({ 
  onLocationSelect, 
  flyCompleted = true 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const { mapContainerRef, mapLoaded } = useMapContainer();
  const { markerPos } = useMarkerPosition({ 
    selectedLocation, 
    mapContainerRef, 
    flyCompleted 
  });
  
  // Add effect to handle map navigation events
  useEffect(() => {
    const handleMapNavigationEvent = () => {
      if (selectedLocation) {
        console.log("MapSearchOverlay: Map navigation event received, re-selecting location");
        // Small delay to ensure components are ready
        setTimeout(() => {
          handleLocationSelect(selectedLocation);
        }, 300);
      }
    };
    
    window.addEventListener('mapNavigationRequest', handleMapNavigationEvent);
    
    return () => {
      window.removeEventListener('mapNavigationRequest', handleMapNavigationEvent);
    };
  }, [selectedLocation]);
  
  const handleLocationSelect = (location: Location) => {
    console.log("MapSearchOverlay: Location selected:", location.label);
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const handleCloseTag = () => {
    setSelectedLocation(null);
  };

  return (
    <>
      <SearchBox onLocationSelect={handleLocationSelect} />
      
      <LocationTagPortal
        location={selectedLocation}
        markerPos={markerPos}
        mapContainerRef={mapContainerRef}
        mapLoaded={mapLoaded}
        onClose={handleCloseTag}
      />
    </>
  );
};

export default MapSearchOverlay;
