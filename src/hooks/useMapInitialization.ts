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
  
  useEffect(() => {
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
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        
        try {
          if (mapRef.current && mapRef.current.remove) {
            try {
              const container = mapRef.current.getContainer();
              if (container && document.body.contains(container)) {
                console.log('Map container exists and is attached - removing map instance');
                mapRef.current.remove();
              }
            } catch (e) {
              console.log('Map container already detached or removed');
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
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

  // Set up an interval to continually check map validity, but with less frequency
  useEffect(() => {
    const checkMapValidity = () => {
      if (!mapRef.current) return;
      
      try {
        // Use utility function for map validation
        const isValid = isMapValid(mapRef.current);
        validityChecksRef.current += 1;
        
        // If we previously thought the map was ready but now it's not valid
        if (isMapReady && !isValid) {
          console.warn('Map container is no longer valid, marking map as not ready');
          setIsMapReady(false);
          mapAttachedRef.current = false;
          
          // Try recovery if we've had too many failed checks but limit attempts
          if (validityChecksRef.current > 5 && recoveryAttemptRef.current < 2) {
            console.log('Attempting to recover map after multiple failed validity checks');
            recoveryAttemptRef.current += 1;
            
            // This is a more aggressive recovery approach
            setTimeout(() => {
              // Try to recreate the map if it's completely broken
              if (recoveryAttemptRef.current === 2) {
                console.log("Attempting full map recreation");
                setMapInstanceKey(Date.now()); // This will trigger a complete recreation
                return;
              }
              
              // Otherwise try to recover the existing map
              if (mapRef.current) {
                try {
                  console.log("Attempting map recovery");
                  mapRef.current.invalidateSize(true);
                  
                  // Check if the map is valid after recovery
                  setTimeout(() => {
                    if (mapRef.current && isMapValid(mapRef.current)) {
                      console.log("Map recovery successful");
                      mapAttachedRef.current = true;
                      setIsMapReady(true);
                    }
                  }, 500);
                } catch (err) {
                  console.error("Map recovery failed:", err);
                }
              }
            }, 1000);
          }
        }
        
        // If we know the map is attached but it's not marked as ready
        if (mapAttachedRef.current && !isMapReady) {
          console.log('Map is attached but not marked as ready, fixing state');
          setIsMapReady(true);
        }
      } catch (err) {
        // Only update state if needed
        if (isMapReady) {
          console.warn("Map validation error:", err.message);
          setIsMapReady(false);
          mapAttachedRef.current = false;
        }
      }
    };
    
    // Check validity less frequently to reduce overhead (5 seconds)
    validityCheckIntervalRef.current = setInterval(checkMapValidity, 5000);
    
    return () => {
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [isMapReady]);

  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      const container = map.getContainer();
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        mapRef.current = map;
        mapAttachedRef.current = true;
        
        // Reset counters when we get a valid map
        validityChecksRef.current = 0;
        recoveryAttemptRef.current = 0;
        
        // Sequence of invalidation attempts to ensure the map is fully initialized
        const invalidateTimings = [300, 800, 1500, 3000];
        invalidateTimings.forEach((timing, index) => {
          setTimeout(() => {
            if (mapRef.current) {
              try {
                mapRef.current.invalidateSize(true);
                if (index === invalidateTimings.length - 1) {
                  console.log('Final map invalidation completed, marking as ready');
                  setIsMapReady(true);
                  
                  // After the map is ready and has been invalidated multiple times,
                  // it should be stable enough for initial navigation
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
                }
              } catch (err) {
                console.warn(`Error during invalidation ${index}:`, err);
              }
            }
          }, timing);
        });
        
        // Separate initial location handling from invalidation sequence for more reliability
        if (selectedLocation) {
          console.log('Scheduling initial location navigation');
          setTimeout(() => {
            if (mapRef.current && isMapValid(mapRef.current) && !initialFlyComplete.current) {
              try {
                console.log('Flying to initial location');
                initialFlyComplete.current = true;
                mapRef.current.flyTo(
                  [selectedLocation.y, selectedLocation.x], 
                  18, 
                  { animate: true, duration: 1.5 }
                );
              } catch (err) {
                console.warn('Error flying to initial location:', err);
              }
            }
          }, 2000);
        }
      } else {
        console.warn('Map container not verified, skipping reference assignment');
        
        // Add a retry mechanism for map reference
        setTimeout(() => {
          try {
            if (map && map.getContainer() && document.body.contains(map.getContainer())) {
              console.log('Map container verified on retry, storing reference');
              mapRef.current = map;
              mapAttachedRef.current = true;
              setIsMapReady(true);
              map.invalidateSize(true);
            }
          } catch (e) {
            console.error('Error in map reference retry:', e);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
      // Try to recover by creating a new map instance after a delay
      setTimeout(() => {
        if (!mapRef.current) {
          console.log('Attempting to recover by recreating map');
          setMapInstanceKey(Date.now());
        }
      }, 3000);
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
