
import { useRef, useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { toast } from 'sonner';

// Extended interface for HTMLElement with custom Leaflet properties
interface HTMLElementWithLeafletProps extends HTMLElement {
  _leaflet_map_reused?: boolean;
  _leafletMapId?: number;
}

// Extended interface for Leaflet map with internal properties
interface LeafletMapWithInternal extends L.Map {
  _leaflet_id?: number;
}

export function useMapInitialization(selectedLocation?: { x: number, y: number }) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  const mapAttachedRef = useRef(false);
  const validityChecksRef = useRef(0);
  const recoveryAttemptRef = useRef(0);
  const initialFlyComplete = useRef(false);
  const validityCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLElementWithLeafletProps | null>(null);
  const isCleaningUpRef = useRef(false);
  const lastMapInstanceRef = useRef<L.Map | null>(null);
  
  // Reset the map instance with a new key
  const resetMapInstance = useCallback(() => {
    if (isCleaningUpRef.current) return;
    
    // Clean up the existing map first with better error handling
    if (mapRef.current) {
      try {
        console.log('Removing existing map instance before reset');
        const currentMap = mapRef.current;
        mapRef.current = null;
        lastMapInstanceRef.current = null;
        
        // Only remove if it's still valid and not reused
        if (currentMap && typeof currentMap.remove === 'function') {
          const container = currentMap.getContainer() as HTMLElementWithLeafletProps;
          if (container && !container._leaflet_map_reused) {
            currentMap.remove();
          }
        }
      } catch (err) {
        console.warn('Error removing map during reset:', err);
      }
    }
    
    // Generate a new key to force recreation
    setMapInstanceKey(Date.now());
    mapAttachedRef.current = false;
    validityChecksRef.current = 0;
    recoveryAttemptRef.current = 0;
    initialFlyComplete.current = false;
    setIsMapReady(false);
    
    console.log('Map instance reset with new key:', mapInstanceKey);
  }, [mapInstanceKey]);
  
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
          const currentMap = mapRef.current;
          const container = containerRef.current;
          
          console.log('Attempting to remove map instance');
          
          // Clear the reference immediately to prevent reuse
          mapRef.current = null;
          containerRef.current = null;
          mapAttachedRef.current = false;
          setIsMapReady(false);
          
          // Check if map is still valid before trying to remove
          if (currentMap && typeof currentMap.remove === 'function') {
            try {
              if (container) {
                container._leaflet_map_reused = true;
              }
              currentMap.remove();
              console.log('Map instance successfully removed');
            } catch (err) {
              console.warn('Error during map removal:', err);
            }
          }
        } catch (err) {
          console.warn('Error during map cleanup:', err);
        }
      }
    };
  }, [mapInstanceKey]);

  // Check map validity less frequently
  useEffect(() => {
    if (isMapReady || isCleaningUpRef.current) return;
    
    const checkMapValidity = () => {
      if (!mapRef.current || isCleaningUpRef.current) return;
      
      try {
        const isValid = isMapValid(mapRef.current);
        validityChecksRef.current += 1;
        
        if (isValid && !isMapReady && mapAttachedRef.current && !isCleaningUpRef.current) {
          console.log('Map is now valid, marking as ready');
          setIsMapReady(true);
          
          if (validityCheckIntervalRef.current) {
            clearInterval(validityCheckIntervalRef.current);
            validityCheckIntervalRef.current = null;
          }
        }
        else if (!isValid && isMapReady && !isCleaningUpRef.current) {
          console.warn('Map is no longer valid, attempting recovery');
          
          if (recoveryAttemptRef.current < 2) {
            recoveryAttemptRef.current += 1;
            
            setTimeout(() => {
              if (mapRef.current && !isCleaningUpRef.current) {
                try {
                  mapRef.current.invalidateSize(true);
                } catch (err) {
                  console.error("Map recovery failed:", err);
                  
                  // If recovery fails twice, reset the map entirely
                  if (recoveryAttemptRef.current >= 2) {
                    resetMapInstance();
                  }
                }
              }
            }, 1000);
          } else {
            // Reset the map if too many recovery attempts fail
            resetMapInstance();
          }
        }
      } catch (err) {
        console.warn("Map validation error:", err instanceof Error ? err.message : String(err));
      }
    };
    
    validityCheckIntervalRef.current = setInterval(checkMapValidity, 10000);
    
    return () => {
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [isMapReady, resetMapInstance]);

  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (isCleaningUpRef.current) {
      console.log('Cleanup in progress, ignoring map reference');
      return;
    }
    
    if (mapRef.current === map) {
      console.log('Same map reference provided, skipping');
      return;
    }
    
    // If we already have a map reference and it's different, clean it up first
    if (mapRef.current && mapRef.current !== map) {
      console.log('New map reference provided, cleaning up old reference');
      try {
        const oldMap = mapRef.current;
        const oldContainer = oldMap.getContainer() as HTMLElementWithLeafletProps;
        
        // Mark the old container as being reused to prevent the error
        if (oldContainer) {
          oldContainer._leaflet_map_reused = true;
        }
        
        // Only remove if it's not the same instance
        if (oldMap !== map) {
          oldMap.remove();
        }
      } catch (err) {
        // This error is expected when containers are reused, just log it
        console.warn('Expected error during map cleanup:', err.message);
      }
    }
    
    try {
      const container = map.getContainer() as HTMLElementWithLeafletProps;
      
      // Verify the container exists and is in the DOM
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        
        // Store references
        mapRef.current = map;
        lastMapInstanceRef.current = map;
        containerRef.current = container;
        mapAttachedRef.current = true;
        
        // Reset counters
        validityChecksRef.current = 0;
        recoveryAttemptRef.current = 0;
        
        // Add a custom property to mark this container as used
        const mapWithInternal = map as LeafletMapWithInternal;
        container._leafletMapId = mapWithInternal._leaflet_id;
        
        setTimeout(() => {
          if (mapRef.current && !isCleaningUpRef.current) {
            try {
              mapRef.current.invalidateSize(true);
              console.log('Initial map invalidation completed');
              setIsMapReady(true);
              
              // Handle initial location navigation
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
    resetMapInstance
  };
}
