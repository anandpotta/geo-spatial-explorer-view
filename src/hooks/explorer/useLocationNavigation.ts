
import { useState, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { toast } from '@/components/ui/use-toast';

export function useLocationNavigation() {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [flyCompleted, setFlyCompleted] = useState<boolean>(true);
  const [shouldSwitchToLeaflet, setShouldSwitchToLeaflet] = useState(false);
  const locationSelectionTimeRef = useRef<number | null>(null);
  const previousLocationRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationSelect = (location: Location) => {
    // Prevent multiple rapid location selections
    const now = Date.now();
    if (locationSelectionTimeRef.current && 
        now - locationSelectionTimeRef.current < 800) { // Slightly faster prevention
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
    console.log("Main: Location selected:", location.label);
    setSelectedLocation(location);
    setFlyCompleted(false);
    
    // Plan to switch to leaflet after fly completes
    setShouldSwitchToLeaflet(true);
    
    // Safety timeout - if fly completion doesn't trigger within 8 seconds,
    // force transition to continue
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      if (!flyCompleted) {
        console.log("Fly completion timeout - forcing completion");
        setFlyCompleted(true);
      }
    }, 8000);
  };

  const handleFlyComplete = () => {
    console.log("Main: Fly completed");
    setFlyCompleted(true);
    
    // Clear any pending timeouts
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    
    // Reset location selection timer
    locationSelectionTimeRef.current = null;
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

  // Cleanup function for timeouts
  const cleanup = () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
  };

  return {
    selectedLocation,
    flyCompleted,
    shouldSwitchToLeaflet,
    setShouldSwitchToLeaflet,
    handleLocationSelect,
    handleFlyComplete,
    handleSavedLocationSelect,
    cleanup
  };
}
