
import React from 'react';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';

interface MapSearchOverlayProps {
  onLocationSelect: (location: Location) => void;
}

const MapSearchOverlay: React.FC<MapSearchOverlayProps> = ({ onLocationSelect }) => {
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

export default MapSearchOverlay;
