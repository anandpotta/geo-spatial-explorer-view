
import { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import { getSavedMarkers } from '@/utils/marker-utils';
import { toast } from 'sonner';

export function useMapInitialization(selectedLocation?: { x: number, y: number }) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  const mapAttachedRef = useRef(false);
  const validityChecksRef = useRef(0);
  const recoveryAttemptRef = useRef(0);
  
  useEffect(() => {
    setupLeafletIcons();
    mapAttachedRef.current = false;
    validityChecksRef.current = 0;
    recoveryAttemptRef.current = 0;
    
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
    };
  }, [mapInstanceKey]);

  // Set up an interval to continually check map validity
  useEffect(() => {
    const checkMapValidity = () => {
      if (!mapRef.current) return;
      
      try {
        // Safe check for container validity
        const container = mapRef.current.getContainer();
        const isValid = container && document.body.contains(container);
        validityChecksRef.current += 1;
        
        // If we previously thought the map was ready but now it's not valid
        if (isMapReady && !isValid) {
          console.warn('Map container is no longer valid, marking map as not ready');
          setIsMapReady(false);
          mapAttachedRef.current = false;
          
          // Try recovery if we've had too many failed checks
          if (validityChecksRef.current > 5 && recoveryAttemptRef.current < 2) {
            console.log('Attempting to recover map after multiple failed validity checks');
            recoveryAttemptRef.current += 1;
            setTimeout(() => {
              if (mapRef.current) {
                try {
                  mapRef.current.invalidateSize(true);
                } catch (err) {
                  // Ignore errors during recovery
                }
              }
            }, 500);
          }
        }
        
        // If we know the map is attached but it's not marked as ready
        if (mapAttachedRef.current && !isMapReady) {
          console.log('Map is attached but not marked as ready, fixing state');
          setIsMapReady(true);
        }
      } catch (err) {
        // Don't log the error as it causes console noise
        // Only update state if needed
        if (isMapReady) {
          setIsMapReady(false);
          mapAttachedRef.current = false;
        }
      }
    };
    
    // Check validity less frequently to reduce overhead
    const interval = setInterval(checkMapValidity, 3000);
    
    return () => {
      clearInterval(interval);
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
                }
              } catch (err) {
                console.warn(`Error during invalidation ${index}:`, err);
              }
            }
          }, timing);
        });
        
        if (selectedLocation) {
          console.log('Flying to initial location');
          setTimeout(() => {
            if (mapRef.current) {
              try {
                const container = mapRef.current.getContainer();
                if (container && document.body.contains(container)) {
                  mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
                    animate: true,
                    duration: 1.5
                  });
                }
              } catch (err) {
                console.warn('Error flying to initial location:', err);
              }
            }
          }, 2000); // Increased timeout for flying to location
        }
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
