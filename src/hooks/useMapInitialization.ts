
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
  const uniqueComponentId = useRef<string>(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    console.log(`[${uniqueComponentId.current}] Initializing map instance with key: ${mapInstanceKey}`);
    setupLeafletIcons();
    mapAttachedRef.current = false;
    validityChecksRef.current = 0;
    recoveryAttemptRef.current = 0;
    initialFlyComplete.current = false;
    
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
      console.log(`[${uniqueComponentId.current}] Cleaning up map instance with key: ${mapInstanceKey}`);
      if (mapRef.current) {
        console.log(`[${uniqueComponentId.current}] Cleaning up Leaflet map instance`);
        
        try {
          // Check if the map instance is still valid before attempting removal
          if (mapRef.current && typeof mapRef.current.remove === 'function') {
            const mapContainer = mapRef.current.getContainer();
            // Only try to remove if the container exists and is still in the DOM
            if (mapContainer && document.body.contains(mapContainer)) {
              console.log(`[${uniqueComponentId.current}] Map container exists and is attached - removing map instance`);
              mapRef.current.remove();
            } else {
              console.log(`[${uniqueComponentId.current}] Map container already detached or removed`);
            }
          }
        } catch (err) {
          console.error(`[${uniqueComponentId.current}] Error cleaning up map:`, err);
        }
        
        // Always clear our reference
        mapRef.current = null;
        mapAttachedRef.current = false;
        setIsMapReady(false);
      }
      
      // Clear validity check interval
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [mapInstanceKey]);

  // Set up an interval to check map validity less frequently
  useEffect(() => {
    // Only set up the validation check if needed
    if (isMapReady) {
      // No need for continuous checks if map is already valid
      return;
    }
    
    const checkMapValidity = () => {
      if (!mapRef.current) return;
      
      try {
        // Use utility function for map validation
        const isValid = isMapValid(mapRef.current);
        
        // Only increment when checking
        validityChecksRef.current += 1;
        
        // If map is valid but not marked as ready
        if (isValid && !isMapReady && mapAttachedRef.current) {
          console.log(`[${uniqueComponentId.current}] Map is now valid, marking as ready`);
          setIsMapReady(true);
          
          // Clear interval once map is valid
          if (validityCheckIntervalRef.current) {
            clearInterval(validityCheckIntervalRef.current);
            validityCheckIntervalRef.current = null;
          }
        }
        // If map becomes invalid after being ready
        else if (!isValid && isMapReady) {
          console.warn(`[${uniqueComponentId.current}] Map is no longer valid, attempting recovery`);
          
          // Try recovery but limit attempts
          if (recoveryAttemptRef.current < 2) {
            recoveryAttemptRef.current += 1;
            
            setTimeout(() => {
              if (mapRef.current) {
                try {
                  mapRef.current.invalidateSize(true);
                } catch (err) {
                  console.error(`[${uniqueComponentId.current}] Map recovery failed:`, err);
                }
              }
            }, 1000);
          }
        }
      } catch (err) {
        // Only log errors, don't change state unnecessarily
        console.warn(`[${uniqueComponentId.current}] Map validation error:`, err.message);
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
    console.log(`[${uniqueComponentId.current}] Map reference provided`);
    
    // Don't set the ref if we already have one - this prevents double initialization
    if (mapRef.current) {
      console.log(`[${uniqueComponentId.current}] Map reference already exists, skipping assignment`);
      return;
    }
    
    try {
      // Only assign the ref if the map container is actually in the DOM
      const container = map.getContainer();
      if (container && document.body.contains(container)) {
        console.log(`[${uniqueComponentId.current}] Map container verified, storing reference`);
        
        // Assign a unique ID to this map instance for debugging
        (map as any)._instanceId = `${uniqueComponentId.current}-${Date.now()}`;
        
        // Store the reference
        mapRef.current = map;
        mapAttachedRef.current = true;
        
        // Reset counters when we get a valid map
        validityChecksRef.current = 0;
        recoveryAttemptRef.current = 0;
        
        // Single invalidation to ensure the map is properly sized
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.invalidateSize(true);
              console.log(`[${uniqueComponentId.current}] Initial map invalidation completed`);
              setIsMapReady(true);
              
              // Handle initial location navigation once the map is ready
              if (selectedLocation && !initialFlyComplete.current) {
                initialFlyComplete.current = true;
                try {
                  console.log(`[${uniqueComponentId.current}] Flying to initial location after ensuring map stability`);
                  mapRef.current.flyTo(
                    [selectedLocation.y, selectedLocation.x], 
                    18, 
                    { animate: true, duration: 1.5 }
                  );
                } catch (flyErr) {
                  console.error(`[${uniqueComponentId.current}] Error in initial fly operation:`, flyErr);
                }
              }
            } catch (err) {
              console.warn(`[${uniqueComponentId.current}] Error during invalidation:`, err);
            }
          }
        }, 500);
      } else {
        console.warn(`[${uniqueComponentId.current}] Map container not verified, skipping reference assignment`);
      }
    } catch (err) {
      console.error(`[${uniqueComponentId.current}] Error setting map reference:`, err);
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
