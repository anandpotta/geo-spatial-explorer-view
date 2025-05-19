
import React, { useState } from 'react';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';
import LocationTag from './LocationTag';

interface MapSearchOverlayProps {
  onLocationSelect: (location: Location) => void;
}

const MapSearchOverlay: React.FC<MapSearchOverlayProps> = ({ onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const handleCloseTag = () => {
    setSelectedLocation(null);
  };

  return (
    <>
      <div 
        className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
        style={{ 
          maxWidth: '400px',
        }}
      >
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </div>

      {selectedLocation && (
        <LocationTag location={selectedLocation} onClose={handleCloseTag} />
      )}
    </>
  );
};

export default MapSearchOverlay;
