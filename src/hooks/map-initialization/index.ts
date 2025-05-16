
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapInstance } from './useMapInstance';
import { useMapValidityChecks } from './useMapValidityChecks';
import { useInitialFly } from './useInitialFly';
import { useMapSetup } from './useMapSetup';
import { useMapCleanup } from './useMapCleanup';

/**
 * Main hook for map initialization, combining all the smaller hooks
 */
export function useMapInitialization(selectedLocation?: Location) {
  const {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    mapAttachedRef,
    setMapInstanceKey,
    initializeLeaflet
  } = useMapInstance();
  
  const {
    validityChecksRef,
    recoveryAttemptRef,
    validityCheckIntervalRef,
    resetValidityChecks,
    cleanupValidityChecks
  } = useMapValidityChecks();
  
  const {
    initialFlyComplete,
    initialFlyAttempted,
    flyTimeoutRef,
    resetFlyState,
    cleanupFly,
    handleInitialFly: originalHandleInitialFly
  } = useInitialFly();
  
  const { handleSetMapRef: originalHandleSetMapRef } = useMapSetup();

  // Initialize map on mount or key change
  useEffect(() => {
    initializeLeaflet();
    resetValidityChecks();
    resetFlyState();
    
    // Ensure Leaflet CSS is loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Reset map ready state when key changes
    setIsMapReady(false);
  }, [mapInstanceKey]);
  
  // Set up map cleanup
  useMapCleanup(mapRef, mapAttachedRef, setIsMapReady, cleanupValidityChecks, cleanupFly);
  
  // Wrapper functions to connect the hooks
  const handleInitialFly = () => {
    originalHandleInitialFly(mapRef, selectedLocation, recoveryAttemptRef);
  };
  
  const handleSetMapRef = (map: L.Map) => {
    originalHandleSetMapRef(
      map,
      mapRef,
      mapAttachedRef,
      setIsMapReady,
      resetValidityChecks,
      handleInitialFly
    );
  };

  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    handleSetMapRef,
    handleInitialFly
  };
}

// Re-export all hooks for direct access if needed
export * from './useMapInstance';
export * from './useMapValidityChecks';
export * from './useInitialFly';
export * from './useMapSetup';
