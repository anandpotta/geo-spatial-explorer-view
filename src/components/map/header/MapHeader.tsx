
import React, { useCallback, useMemo } from 'react';
import SavedLocationsDropdown from '../SavedLocationsDropdown';
import DownloadButton from './DownloadButton';

interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
  searchLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  };
}

const MapHeader: React.FC<MapHeaderProps> = ({ onLocationSelect, isMapReady = false, searchLocation }) => {
  console.log('MapHeader render:', { isMapReady });

  const handleLocationSelect = useCallback((position: [number, number]) => {
    onLocationSelect(position);
  }, [onLocationSelect]);

  // Memoize the search location to prevent unnecessary re-renders
  const memoizedSearchLocation = useMemo(() => searchLocation, [
    searchLocation?.latitude,
    searchLocation?.longitude,
    searchLocation?.searchString
  ]);

  return (
    <div 
      className="absolute top-4 right-4 z-[1001] flex gap-2" 
      style={{ pointerEvents: 'auto', marginRight: '27px' }}
    >
      <DownloadButton disabled={false} searchLocation={memoizedSearchLocation} />
      <SavedLocationsDropdown 
        onLocationSelect={handleLocationSelect} 
        isMapReady={isMapReady}
      />
    </div>
  );
};

export default MapHeader;
