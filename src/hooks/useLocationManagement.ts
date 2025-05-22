import { useState, useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { toast } from '@/components/ui/use-toast';

export function useLocationManagement() {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [flyCompleted, setFlyCompleted] = useState<boolean>(true);
  const locationSelectionTimeRef = useRef<number | null>(null);
  const [shouldKeepLocation, setShouldKeepLocation] = useState(true);
  const previousLocationRef = useRef<string | null>(null);

  const handleLocationSelect = (location: Location) => {
    // Prevent multiple rapid location selections
    const now = Date.now();
    if (locationSelectionTimeRef.current && 
        now - locationSelectionTimeRef.current < 1000) {
      return;
    }
    
    // Skip if selecting the same location
    const locationId = location.id;
    if (previousLocationRef.current === locationId) {
      console.log("Skipping duplicate location selection");
      return;
    }
    previousLocationRef.current = locationId;
    
    locationSelectionTimeRef.current = now;
    console.log("Main: Location selected:", location.label, "at coordinates:", location.y, location.x);
    
    setSelectedLocation(location);
    setFlyCompleted(false);
    
    // When selecting a location, remember to keep it during view switch
    setShouldKeepLocation(true);
  };

  const handleFlyComplete = () => {
    console.log("Main: Fly completed");
    setFlyCompleted(true);
    
    // Reset location selection timer
    setTimeout(() => {
      locationSelectionTimeRef.current = null;
    }, 500);
  };

  const handleSavedLocationSelect = (position: [number, number]) => {
    // Convert position to Location
    const newLocation: Location = {
      id: `saved-${Date.now()}`,
      label: 'Saved Location',
      x: position[1], // longitude is the second value
      y: position[0]  // latitude is the first value
    };
    handleLocationSelect(newLocation);
  };

  return {
    selectedLocation,
    setSelectedLocation,
    flyCompleted,
    setFlyCompleted,
    shouldKeepLocation,
    setShouldKeepLocation,
    previousLocationRef,
    handleLocationSelect,
    handleFlyComplete,
    handleSavedLocationSelect
  };
}
