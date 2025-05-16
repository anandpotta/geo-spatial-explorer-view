
import { useRef } from 'react';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { isMapValid } from '@/utils/leaflet-type-utils';

/**
 * Hook to handle flying to a location on the map
 */
export function useFlyToLocation() {
  const flyInProgressRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const flyAttemptRef = useRef(0);
  
  // Reset fly attempt counter
  const resetFlyAttempt = () => {
    flyAttemptRef.current = 0;
  };
  
  // Check if fly is in progress
  const isFlyInProgress = () => {
    return flyInProgressRef.current;
  };
  
  // Set fly in progress state
  const setFlyInProgress = (inProgress: boolean) => {
    flyInProgressRef.current = inProgress;
  };
  
  // Get the location ID for comparison
  const getLocationId = (lat: number, lng: number) => {
    return `${lat}-${lng}`;
  };
  
  // Check if location is the same as last one
  const isSameLocation = (locationId: string) => {
    return locationId === lastLocationRef.current;
  };
  
  // Update the last location reference
  const updateLastLocation = (locationId: string) => {
    lastLocationRef.current = locationId;
  };
  
  // Reset last location to trigger a new fly
  const resetLastLocation = () => {
    lastLocationRef.current = null;
  };
  
  return {
    flyInProgressRef,
    lastLocationRef,
    flyAttemptRef,
    resetFlyAttempt,
    isFlyInProgress,
    setFlyInProgress,
    getLocationId,
    isSameLocation,
    updateLastLocation,
    resetLastLocation
  };
}
