
import { useRef, useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { toast } from 'sonner';

// Extended interface for Leaflet map with internal properties
interface LeafletMapWithInternal extends L.Map {
  _leaflet_id?: number;
}

export function useMapInitialization(selectedLocation?: { x: number, y: number }) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  const mapAttachedRef = useRef(false);
  const recoveryAttemptRef = useRef(0);
  const initialFlyComplete = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const isCleaningUpRef = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Reset the map instance with a new key
  const resetMapInstance = useCallback(() => {
    if (isCleaningUpRef.current) return;
    
    // Clean up the existing map first
    if (mapRef.current) {
      try {
        console.log('Removing existing map instance before reset');
        mapRef.current.remove();
        mapRef.current = null;
      } catch (err) {
        console.warn('Error removing map during reset:', err);
      }
    }
    
    // Generate a new key to force recreation
    setMapInstanceKey(Date.now());
    mapAttachedRef.current = false;
    recoveryAttemptRef.current = 0;
    initialFlyComplete.current = false;
    setIsMapReady(false);
    
    console.log('Map instance reset with new key:', mapInstanceKey);
  }, [mapInstanceKey]);
  
  useEffect(() => {
    setupLeafletIcons();
    mapAttachedRef.current = false;
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
      
      // Clear any pending timeouts
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = undefined;
      }
      
      // Clean up map instance if it exists
      if (mapRef.current) {
        try {
          const currentMap = mapRef.current;
          mapRef.current = null;
          containerRef.current = null;
          mapAttachedRef.current = false;
          setIsMapReady(false);
          
          if (currentMap && typeof currentMap.remove === 'function') {
            try {
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

  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    if (isCleaningUpRef.current) {
      console.log('Cleanup in progress, ignoring map reference');
      return;
    }
    
    if (mapRef.current === map) {
      console.log('Same map reference provided, skipping');
      return;
    }
    
    // If we already have a map reference, clean it up first
    if (mapRef.current && mapRef.current !== map) {
      console.log('New map reference provided, cleaning up old reference');
      try {
        mapRef.current.remove();
      } catch (err) {
        console.warn('Error removing old map:', err);
      }
    }
    
    try {
      const container = map.getContainer();
      
      // Verify the container exists and is in the DOM
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        
        // Store references
        mapRef.current = map;
        containerRef.current = container;
        mapAttachedRef.current = true;
        
        // Reset counters
        recoveryAttemptRef.current = 0;
        
        // Add a custom property to mark this container as used
        const mapWithInternal = map as LeafletMapWithInternal;
        (container as any)._leafletMapId = mapWithInternal._leaflet_id;
        
        // Clear any existing timeout
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
        
        // Debounced initialization
        initTimeoutRef.current = setTimeout(() => {
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
        }, 300); // Reduced timeout for better responsiveness
      } else {
        console.warn('Map container not verified, skipping reference assignment');
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  }, [selectedLocation]);

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
