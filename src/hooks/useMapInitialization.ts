
import { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import { getSavedMarkers } from '@/utils/marker-utils';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';

export function useMapInitialization(selectedLocation?: { x: number, y: number }) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  const mapAttachedRef = useRef(false);
  const validityChecksRef = useRef(0);
  const recoveryAttemptRef = useRef(0);
  const initialFlyComplete = useRef(false);
  const validityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const isCleaningUpRef = useRef(false);
  
  useEffect(() => {
    setupLeafletIcons();
    mapAttachedRef.current = false;
    validityChecksRef.current = 0;
    recoveryAttemptRef.current = 0;
    initialFlyComplete.current = false;
    isCleaningUpRef.current = false;
    
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
    
    return () => {
      console.log('Cleaning up map initialization hook');
      isCleaningUpRef.current = true;
      
      // Clear validity check interval first
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
      
      // Clean up map instance if it exists
      if (mapRef.current) {
        try {
          const map = mapRef.current;
          const container = containerRef.current;
          
          console.log('Attempting to remove map instance');
          
          // Clear the reference immediately to prevent reuse
          mapRef.current = null;
          containerRef.current = null;
          mapAttachedRef.current = false;
          setIsMapReady(false);
          
          // Check if container is still valid and attached
          if (container && document.body.contains(container)) {
            // Check if the map is still attached to this container
            if (map.getContainer() === container) {
              console.log('Map container verified, removing map instance');
              map.remove();
            } else {
              console.log('Map container mismatch, skipping removal');
            }
          } else {
            console.log('Container already detached, skipping map removal');
          }
        } catch (err) {
          console.warn('Error during map cleanup:', err);
          // Don't throw, just log the error
        }
      }
    };
  }, [mapInstanceKey]);

  // Set up an interval to check map validity less frequently
  useEffect(() => {
    // Only set up the validation check if needed and not cleaning up
    if (isMapReady || isCleaningUpRef.current) {
      return;
    }
    
    const checkMapValidity = () => {
      if (!mapRef.current || isCleaningUpRef.current) return;
      
      try {
        // Use utility function for map validation
        const isValid = isMapValid(mapRef.current);
        
        // Only increment when checking
        validityChecksRef.current += 1;
        
        // If map is valid but not marked as ready
        if (isValid && !isMapReady && mapAttachedRef.current && !isCleaningUpRef.current) {
          console.log('Map is now valid, marking as ready');
          setIsMapReady(true);
          
          // Clear interval once map is valid
          if (validityCheckIntervalRef.current) {
            clearInterval(validityCheckIntervalRef.current);
            validityCheckIntervalRef.current = null;
          }
        }
        // If map becomes invalid after being ready
        else if (!isValid && isMapReady && !isCleaningUpRef.current) {
          console.warn('Map is no longer valid, attempting recovery');
          
          // Try recovery but limit attempts
          if (recoveryAttemptRef.current < 2) {
            recoveryAttemptRef.current += 1;
            
            setTimeout(() => {
              if (mapRef.current && !isCleaningUpRef.current) {
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
        console.warn("Map validation error:", err.message);
      }
    };
    
    // Check validity less frequently (10 seconds) and only when needed
    validityCheckIntervalRef.current = setInterval(checkMapValidity, 10000);
    
    return () => {
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [isMapReady]);

  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    // Prevent setting if we're cleaning up
    if (isCleaningUpRef.current) {
      console.log('Cleanup in progress, ignoring map reference');
      return;
    }
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      const container = map.getContainer();
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        
        // Store both map and container references
        mapRef.current = map;
        containerRef.current = container;
        mapAttachedRef.current = true;
        
        // Reset counters when we get a valid map
        validityChecksRef.current = 0;
        recoveryAttemptRef.current = 0;
        
        // Single invalidation to ensure the map is properly sized
        setTimeout(() => {
          if (mapRef.current && !isCleaningUpRef.current) {
            try {
              mapRef.current.invalidateSize(true);
              console.log('Initial map invalidation completed');
              setIsMapReady(true);
              
              // Handle initial location navigation once the map is ready
              if (selectedLocation && !initialFlyComplete.current) {
                initialFlyComplete.current = true;
                try {
                  console.log('Flying to initial location after ensuring map stability');
                  mapRef.current.flyTo(
                    [selectedLocation.y, selectedLocation.x], 
                    18, 
                    { animate: true, duration: 1.5 }
                  );
                } catch (flyErr) {
                  console.error('Error in initial fly operation:', flyErr);
                }
              }
            } catch (err) {
              console.warn(`Error during invalidation:`, err);
            }
          }
        }, 500);
      } else {
        console.warn('Map container not verified, skipping reference assignment');
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };

  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    handleSetMapRef,
  };
}
