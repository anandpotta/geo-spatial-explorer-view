
import React from 'react';
import { Location } from '@/utils/geo-utils';
import LocationSearch from '@/components/LocationSearch';

interface LocationSearchContainerProps {
  onLocationSelect: (location: Location) => void;
}

const LocationSearchContainer: React.FC<LocationSearchContainerProps> = ({
  onLocationSelect
}) => {
  return (
    <div 
      className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
      style={{ 
        maxWidth: '400px',
      }}
    >
      <LocationSearch onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default LocationSearchContainer;
