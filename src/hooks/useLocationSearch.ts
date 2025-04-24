
import { useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { toast } from 'sonner';

interface UseLocationSearchResult {
  selectedLocation: Location | undefined;
  currentView: 'cesium' | 'leaflet';
  flyCompleted: boolean;
  setSelectedLocation: (location: Location | undefined) => void;
  setCurrentView: (view: 'cesium' | 'leaflet') => void;
  setFlyCompleted: (completed: boolean) => void;
  handleLocationSelect: (location: Location) => void;
}

export const useLocationSearch = (): UseLocationSearchResult => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium');
  const [flyCompleted, setFlyCompleted] = useState(false);

  const handleLocationSelect = (location: Location) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
    setCurrentView('cesium');
    setFlyCompleted(false);
    
    toast({
      title: 'Location selected',
      description: `Navigating to ${location.label}`,
      duration: 3000,
    });
  };

  return {
    selectedLocation,
    currentView,
    flyCompleted,
    setSelectedLocation,
    setCurrentView,
    setFlyCompleted,
    handleLocationSelect,
  };
};
