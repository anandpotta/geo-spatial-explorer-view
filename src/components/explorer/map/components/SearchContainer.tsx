
import React from 'react';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';

interface SearchContainerProps {
  onLocationSelect: (location: Location) => void;
}

const SearchContainer: React.FC<SearchContainerProps> = ({ onLocationSelect }) => {
  return (
    <div 
      className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
      style={{ 
        maxWidth: '400px',
        zIndex: 30, // Increased z-index to ensure it's always on top
      }}
    >
      <LocationSearch onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default SearchContainer;
