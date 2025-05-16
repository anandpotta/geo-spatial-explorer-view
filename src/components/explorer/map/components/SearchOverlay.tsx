
import React, { useState, useEffect } from 'react';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';
import { formatCoordinates } from '@/utils/location-utils';

interface SearchOverlayProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ 
  onLocationSelect,
  selectedLocation 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Show location details when a location is selected
  useEffect(() => {
    if (selectedLocation) {
      setShowDetails(true);
    }
  }, [selectedLocation]);

  return (
    <div 
      className="absolute top-4 left-0 right-0 z-[10000] mx-auto" 
      style={{ maxWidth: '400px' }}
    >
      <LocationSearch 
        onLocationSelect={onLocationSelect}
        selectedLocation={selectedLocation}
      />
      
      {showDetails && selectedLocation && (
        <div className="mt-2 p-3 bg-background/90 backdrop-blur-sm rounded-lg shadow-lg text-sm animate-fade-in">
          <h3 className="font-medium text-primary">{selectedLocation.label}</h3>
          <p className="text-muted-foreground mt-1">
            {formatCoordinates(selectedLocation.y, selectedLocation.x)}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchOverlay;
