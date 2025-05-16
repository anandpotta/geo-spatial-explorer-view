
import { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
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
  const initialFlyAttempted = useRef(false);
  const validityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const flyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setupLeafletIcons();
    mapAttachedRef.current = false;
    validityChecksRef.current = 0;
    recoveryAttemptRef.current = 0;
    initialFlyComplete.current = false;
    initialFlyAttempted.current = false;
    
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
    
    return () => {
      // Clean up Leaflet map instance
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        
        try {
          // Add an _isDestroyed flag to prevent operations on removed maps
          Object.defineProperty(mapRef.current, '_isDestroyed', {
            value: true,
            writable: false
          });
          
          // Only remove if the container exists and is attached to DOM
          try {
            const container = mapRef.current.getContainer();
            if (container && document.body.contains(container)) {
              console.log('Map container exists and is attached - removing map instance');
              mapRef.current.remove();
            }
          } catch (e) {
            console.log('Map container already detached or removed');
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
        mapRef.current = null;
        mapAttachedRef.current = false;
        setIsMapReady(false);
      }
      
      // Clear intervals and timeouts
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
      
      if (flyTimeoutRef.current) {
        clearTimeout(flyTimeoutRef.current);
        flyTimeoutRef.current = null;
      }
    };
  }, [mapInstanceKey]);

  // Handle initial location navigation safely
  const handleInitialFly = () => {
    // Only attempt flying once
    if (initialFlyAttempted.current || initialFlyComplete.current || !selectedLocation || !mapRef.current) {
      return;
    }
    
    initialFlyAttempted.current = true;
    
    try {
      // First check if map is valid
      if (!isMapValid(mapRef.current)) {
        console.warn("Map not valid for initial fly");
        return;
      }
      
      // Explicitly check map panes
      const mapPanes = mapRef.current.getPanes();
      if (!mapPanes || !mapPanes.mapPane) {
        console.warn("Map panes not ready for initial fly");
        return;
      }
      
      console.log('Flying to initial location after ensuring map stability');
      mapRef.current.setView(
        [selectedLocation.y, selectedLocation.x], 
        16, 
        { animate: false }
      );
      
      initialFlyComplete.current = true;
    } catch (flyErr) {
      console.error('Error in initial fly operation:', flyErr);
      
      // Try again once more after a delay
      if (recoveryAttemptRef.current < 2) {
        recoveryAttemptRef.current++;
        flyTimeoutRef.current = setTimeout(() => {
          if (mapRef.current && isMapValid(mapRef.current) && !initialFlyComplete.current) {
            try {
              console.log('Retry initial fly with setView');
              mapRef.current.setView(
                [selectedLocation.y, selectedLocation.x], 
                16, 
                { animate: false }
              );
              initialFlyComplete.current = true;
            } catch (retryErr) {
              console.error('Error in retry fly operation:', retryErr);
            }
          }
        }, 1500);
      }
    }
  };

  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      const container = map.getContainer();
      if (!container || !document.body.contains(container)) {
        console.warn('Map container not in DOM, skipping reference');
        return;
      }
      
      console.log('Map container verified, storing reference');
      
      // Add a custom property to check if map is destroyed
      Object.defineProperty(map, '_isDestroyed', {
        value: false,
        writable: true
      });
      
      mapRef.current = map;
      mapAttachedRef.current = true;
      
      // Reset counters when we get a valid map
      validityChecksRef.current = 0;
      recoveryAttemptRef.current = 0;
      
      // Single invalidation to ensure the map is properly sized
      setTimeout(() => {
        if (!mapRef.current || (mapRef.current as any)._isDestroyed) return;
        
        try {
          // Make sure the map is still valid
          if (!isMapValid(mapRef.current)) {
            console.warn('Map became invalid, cannot initialize');
            return;
          }
          
          mapRef.current.invalidateSize(true);
          console.log('Initial map invalidation completed');
          
          // Delay setting map ready to ensure the map is stable
          setTimeout(() => {
            if (!mapRef.current || (mapRef.current as any)._isDestroyed) return;
            setIsMapReady(true);
            
            // Wait a bit longer before trying to fly to location
            setTimeout(() => {
              handleInitialFly();
            }, 500);
          }, 300);
          
        } catch (err) {
          console.warn(`Error during initialization:`, err);
        }
      }, 500);
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
    handleInitialFly
  };
}
