
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
      
      {selectedLocation && (
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-md text-center w-full animate-fade-in">
          <h3 className="font-medium text-sm">{selectedLocation.label}</h3>
          <p className="text-xs text-gray-600">
            Lat: {selectedLocation.y.toFixed(4)}, Long: {selectedLocation.x.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchOverlay;
