
import React from 'react';
import LocationSearch from '@/components/LocationSearch';
import SavedLocationsDropdown from '@/components/map/SavedLocationsDropdown';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import { useDrawings } from '@/hooks/useDrawings';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import DownloadButton from '@/components/map/controls/DownloadButton';
import { Location } from '@/utils/location-utils';

interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}

const MapHeader = ({ onLocationSelect, isMapReady = false }: MapHeaderProps) => {
  const { markers } = useSavedLocations();
  const { savedDrawings } = useDrawings();
  
  // Convert Location to position array for LocationSearch
  const handleLocationSearchSelect = (location: Location) => {
    onLocationSelect([location.y, location.x]); // Convert to [lat, lng]
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-2 flex flex-wrap items-center gap-2 justify-between shadow-sm">
      <div className="flex items-center gap-2 flex-1">
        <LocationSearch 
          onLocationSelect={handleLocationSearchSelect}
          disabled={!isMapReady}
        />
        <SavedLocationsDropdown 
          onLocationSelect={onLocationSelect}
          isMapReady={isMapReady}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <DownloadButton 
          drawings={savedDrawings} 
          markers={markers} 
        />
        <SyncStatusIndicator />
      </div>
    </div>
  );
};

export default MapHeader;
