
import React from 'react';
import SavedLocationsDropdown from '../SavedLocationsDropdown';

interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}

const MapHeader: React.FC<MapHeaderProps> = ({ onLocationSelect, isMapReady = false }) => {
  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <SavedLocationsDropdown 
        onLocationSelect={onLocationSelect} 
        isMapReady={isMapReady}
      />
    </div>
  );
};

export default MapHeader;
