
import React, { useState } from 'react';
import LocationSearch from '@/components/LocationSearch';
import { Location } from '@/utils/geo-utils';
import { formatCoordinates } from '@/utils/geo-utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SearchOverlayProps {
  onLocationSelect: (location: Location) => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };
  
  const clearSelectedLocation = () => {
    setSelectedLocation(null);
  };
  
  return (
    <div 
      className="absolute top-4 left-0 right-0 z-[10000] mx-auto flex flex-col gap-2" 
      style={{ maxWidth: '400px' }}
    >
      <LocationSearch onLocationSelect={handleLocationSelect} />
      
      {selectedLocation && (
        <div className="bg-white rounded-md shadow-lg p-3 mt-1 flex justify-between items-center">
          <div>
            <h4 className="font-medium text-sm">{selectedLocation.label}</h4>
            <p className="text-xs text-gray-600">
              {formatCoordinates(selectedLocation.y, selectedLocation.x)}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelectedLocation}
            className="h-6 w-6 p-0"
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchOverlay;
