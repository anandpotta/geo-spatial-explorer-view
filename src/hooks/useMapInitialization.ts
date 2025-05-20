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
  const mapContainerIdRef = useRef<string>(`map-container-${Date.now()}`);
  
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
    
    // Generate a new container ID when the key changes
    mapContainerIdRef.current = `map-container-${Date.now()}`;
    
    return () => {
      // Clean up the map reference thoroughly when unmounting
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        
        try {
          if (mapRef.current && mapRef.current.remove) {
            try {
              const container = mapRef.current.getContainer();
              if (container && document.body.contains(container)) {
                console.log('Map container exists and is attached - removing map instance');
                
                // Remove all layers first to prevent memory leaks
                mapRef.current.eachLayer(layer => {
                  if (layer) {
                    try {
                      mapRef.current?.removeLayer(layer);
                    } catch (e) {
                      console.warn('Error removing layer:', e);
                    }
                  }
                });
                
                // Now remove the map
                mapRef.current.remove();
              }
            } catch (e) {
              console.log('Map container already detached or removed');
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
        // Set mapRef to null to ensure it's fully cleaned up
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
          console.log('Map is now valid, marking as ready');
          setIsMapReady(true);
          
          // Clear interval once map is valid
          if (validityCheckIntervalRef.current) {
            clearInterval(validityCheckIntervalRef.current);
            validityCheckIntervalRef.current = null;
          }
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
    
    if (mapRef.current) {
      console.log('Map reference already exists, checking if it is the same instance');
      
      // Check if this is the same map instance - if so, we can just keep it
      if (mapRef.current === map) {
        console.log('Same map instance, keeping existing reference');
        return;
      }
      
      // If it's a different instance, clean up the old one first
      console.log('Different map instance, cleaning up old one first');
      try {
        mapRef.current.remove();
      } catch (e) {
        console.warn('Error removing old map instance:', e);
      }
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
        
        // Single invalidation to ensure the map is properly sized
        setTimeout(() => {
          if (mapRef.current) {
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

  // Add a function to force reset the map when needed
  const resetMap = () => {
    console.log('Forcing map reset');
    
    // Clean up existing map instance
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.warn('Error removing map during reset:', e);
      }
      mapRef.current = null;
    }
    
    // Generate new key to force remount
    setMapInstanceKey(Date.now());
    setIsMapReady(false);
    mapAttachedRef.current = false;
  };

  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    handleSetMapRef,
    resetMap,
    mapContainerId: mapContainerIdRef.current,
  };
}
