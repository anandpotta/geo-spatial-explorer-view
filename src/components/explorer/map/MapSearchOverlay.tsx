
import React, { useState } from 'react';
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
  
  const handleLocationSelect = (location: Location) => {
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
