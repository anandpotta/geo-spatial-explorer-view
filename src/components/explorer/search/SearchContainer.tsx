
import React from 'react';
import LocationSearch from '@/components/LocationSearch';

interface SearchContainerProps {
  isTransitioning: boolean;
  onLocationSelect: (location: any) => void;
}

const SearchContainer = ({ isTransitioning, onLocationSelect }: SearchContainerProps) => {
  return (
    <div 
      className="absolute top-4 left-0 right-0 z-[10000] mx-auto transition-opacity duration-300" 
      style={{ 
        maxWidth: '400px',
        opacity: isTransitioning ? 0.6 : 1,
        pointerEvents: isTransitioning ? 'none' : 'auto'
      }}
    >
      <LocationSearch onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default SearchContainer;
