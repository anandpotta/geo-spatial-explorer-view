
import { useCallback } from 'react';
import { Location } from '@/utils/geo-utils';

interface LocationHandlerProps {
  handleLocationSelect: (position: [number, number]) => Location | null;
  onLocationSelect?: (location: Location) => void;
}

const LocationHandler = ({ handleLocationSelect, onLocationSelect }: LocationHandlerProps) => {
  const handleSelection = useCallback((position: [number, number]) => {
    console.log("Location selected in LocationHandler:", position);
    
    const location = handleLocationSelect(position);
    
    if (location && onLocationSelect) {
      onLocationSelect(location);
    }
  }, [handleLocationSelect, onLocationSelect]);
  
  return null; // This is just a logic component, no UI
};

export default LocationHandler;
