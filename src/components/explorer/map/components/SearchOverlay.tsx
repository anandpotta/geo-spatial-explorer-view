
import React from 'react';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';

interface SearchOverlayProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onLocationSelect, selectedLocation }) => {
  return (
    <div 
      className="absolute top-4 left-0 right-0 z-[10000] mx-auto flex flex-col items-center gap-2" 
      style={{ maxWidth: '400px' }}
    >
      <LocationSearch onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default SearchOverlay;
