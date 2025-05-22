
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useLocationSyncState } from './useLocationSyncState';
import { useLocationProcessing } from './useLocationProcessing';
import { useTimers } from './useTimers';
import { useInitialPositioning } from './useInitialPositioning';
import type { LocationSyncConfig } from './types';

export function useLocationSync(
  map: LocationSyncConfig['map'],
  selectedLocation?: LocationSyncConfig['selectedLocation'],
  isMapReady: boolean = false
) {
  // Get state management hooks
  const {
    hasInitialPositioning,
    setHasInitialPositioning,
    processedLocationRef,
    flyInProgressRef,
    transitionInProgressRef,
    isUnmountedRef,
    initialPositioningAttemptsRef,
    timeoutRefsRef,
    resetState
  } = useLocationSyncState();
  
  // Get timer utilities
  const { safeSetTimeout } = useTimers();
  
  // Get location processing functionality
  const { processLocationChange } = useLocationProcessing();
  
  // Get initial positioning functionality
  const { forceInitialPositioning, handleMapReady } = useInitialPositioning();

  // Clear all timeouts on unmount or when dependencies change
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      isUnmountedRef.current = true;
      
      // Clear all timeouts
      resetState();
    };
  }, [map]);

  // Force map refresh after it becomes ready
  useEffect(() => {
    handleMapReady(
      map, 
      isMapReady, 
      selectedLocation, 
      hasInitialPositioning,
      {
        isUnmountedRef,
        setHasInitialPositioning
      }
    );
  }, [map, isMapReady, selectedLocation, hasInitialPositioning]);

  // Handle location changes
  useEffect(() => {
    if (!selectedLocation || !map || !isMapReady) return;
    
    console.log(`useLocationSync: Syncing to location ${selectedLocation.label} at [${selectedLocation.y}, ${selectedLocation.x}]`);

    // Prevent operations during active transitions
    if (transitionInProgressRef.current) {
      console.log('useLocationSync: View transition in progress, skipping location update');
      return;
    }

    // Create a location identifier to track changes
    const locationId = `${selectedLocation.id}:${selectedLocation.y}:${selectedLocation.x}`;

    // Skip if it's the same location we're already at
    if (locationId === processedLocationRef.current && hasInitialPositioning) {
      console.log('useLocationSync: Skipping duplicate location selection', locationId);
      return;
    }

    // Skip if fly is already in progress
    if (flyInProgressRef.current) {
      console.log('useLocationSync: Fly already in progress, will try again later');
      
      // Queue the operation by setting a timeout
      const timer = safeSetTimeout(() => {
        if (locationId === processedLocationRef.current) {
          console.log('useLocationSync: Skipping deferred update - location already processed');
          return;
        }
        
        // Only process if component is still mounted
        if (!isUnmountedRef.current) {
          processLocationChange(
            map, 
            locationId, 
            selectedLocation, 
            {
              isUnmountedRef,
              flyInProgressRef, 
              transitionInProgressRef,
              processedLocationRef,
              setHasInitialPositioning
            }
          );
        }
      }, 1200);
      
      return;
    }

    // Multiple retry attempts for initial positioning
    if (!hasInitialPositioning) {
      initialPositioningAttemptsRef.current++;
      
      if (initialPositioningAttemptsRef.current > 3) {
        console.log(`useLocationSync: Multiple attempts (${initialPositioningAttemptsRef.current}) to position map, forcing approach`);
        // Force a delay and retry with basic approach
        safeSetTimeout(() => {
          if (map && !isUnmountedRef.current) {
            forceInitialPositioning(map, selectedLocation, {
              isUnmountedRef,
              setHasInitialPositioning
            });
          }
        }, 800);
        return;
      }
    }

    // Process the location change
    processLocationChange(
      map, 
      locationId, 
      selectedLocation, 
      {
        isUnmountedRef,
        flyInProgressRef, 
        transitionInProgressRef,
        processedLocationRef,
        setHasInitialPositioning
      }
    );
  }, [selectedLocation, map, isMapReady, hasInitialPositioning]);
}
