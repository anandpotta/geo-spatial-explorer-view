
import { useRef, useState, useEffect } from 'react';
import { isMapValid } from '@/utils/leaflet-type-utils';
import L from 'leaflet';

export function useMapValidityChecks(
  mapRef: React.RefObject<L.Map | null>,
  isMapReady: boolean,
  mapAttachedRef: React.MutableRefObject<boolean>
) {
  const validityChecksRef = useRef(0);
  const recoveryAttemptRef = useRef(0);
  const validityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only set up the validation check if needed
    if (isMapReady) {
      // No need for continuous checks if map is already valid
      return;
    }
    
    const checkMapValidity = () => {
      if (!mapRef.current) return false;
      
      try {
        // Use utility function for map validation
        const isValid = isMapValid(mapRef.current);
        
        // Only increment when checking
        validityChecksRef.current += 1;
        
        // If map is valid but not marked as ready
        if (isValid && !isMapReady && mapAttachedRef.current) {
          console.log('Map is now valid, marking as ready');
          
          // Try an immediate invalidateSize to ensure proper sizing
          try {
            mapRef.current.invalidateSize(true);
          } catch (err) {
            console.warn('Error during validation invalidateSize:', err);
          }
          
          // Clear interval once map is valid
          if (validityCheckIntervalRef.current) {
            clearInterval(validityCheckIntervalRef.current);
            validityCheckIntervalRef.current = null;
          }
          
          return true;
        }
        // If map becomes invalid after being ready
        else if (!isValid && isMapReady) {
          console.warn('Map is no longer valid, attempting recovery');
          
          // Try recovery but limit attempts
          if (recoveryAttemptRef.current < 2) {
            recoveryAttemptRef.current += 1;
            
            setTimeout(() => {
              if (mapRef.current) {
                try {
                  mapRef.current.invalidateSize(true);
                } catch (err) {
                  console.error("Map recovery failed:", err);
                }
              }
            }, 1000);
          }
        }
      } catch (err) {
        // Only log errors, don't change state unnecessarily
        console.warn("Map validation error:", err);
      }
      
      return false;
    };
    
    // Initial check on mount with a delay to ensure DOM is ready
    setTimeout(checkMapValidity, 500);
    
    // Check validity less frequently (10 seconds) and only when needed
    validityCheckIntervalRef.current = setInterval(() => {
      if (checkMapValidity()) {
        // Set map as ready if valid
        return true;
      }
    }, 10000);
    
    return () => {
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [isMapReady, mapRef, mapAttachedRef]);
  
  return {
    validityChecksRef,
    recoveryAttemptRef,
    validityCheckIntervalRef
  };
}
