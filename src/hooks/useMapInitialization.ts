
import { useMapState } from './map/useMapState';
import { useMapValidityChecks } from './map/useMapValidityChecks';
import { useMapCleanup } from './map/useMapCleanup';
import { useMapInitializer } from './map/useMapInitializer';
import { useMapRef } from './map/useMapRef';

export function useMapInitialization(selectedLocation?: { x: number, y: number }) {
  // Get basic map state
  const {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    mapAttachedRef,
    initialFlyComplete
  } = useMapState(selectedLocation);
  
  // Set up map validity checks
  const {
    validityChecksRef,
    recoveryAttemptRef,
    validityCheckIntervalRef
  } = useMapValidityChecks(mapRef, isMapReady, mapAttachedRef);
  
  // Initialize map and set up required resources
  useMapInitializer(
    mapInstanceKey,
    mapAttachedRef,
    validityChecksRef,
    recoveryAttemptRef,
    initialFlyComplete,
    setIsMapReady
  );
  
  // Handle map cleanup
  useMapCleanup(mapRef, mapAttachedRef, setIsMapReady, validityCheckIntervalRef);
  
  // Get the map reference handler
  const { handleSetMapRef } = useMapRef(
    mapRef,
    mapAttachedRef,
    validityChecksRef,
    recoveryAttemptRef,
    initialFlyComplete,
    setIsMapReady,
    mapInstanceKey,
    selectedLocation
  );
  
  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    handleSetMapRef,
  };
}
