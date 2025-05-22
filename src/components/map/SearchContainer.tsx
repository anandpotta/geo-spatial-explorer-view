
import React from 'react';
import { Location } from '@/utils/geo-utils';
import LocationSearch from '../LocationSearch';

interface SearchContainerProps {
  onLocationSelect: (location: Location) => void;
}

const SearchContainer: React.FC<SearchContainerProps> = ({
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

export default SearchContainer;
