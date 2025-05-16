
import { useEffect } from 'react';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

/**
 * Hook to handle map reference setup and validation
 */
export function useMapSetup() {
  // Handle setting the map reference
  const handleSetMapRef = (
    map: L.Map,
    mapRef: React.MutableRefObject<L.Map | null>,
    mapAttachedRef: React.MutableRefObject<boolean>,
    setIsMapReady: (ready: boolean) => void,
    resetValidityChecks: () => void,
    handleInitialFly: () => void
  ) => {
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
      resetValidityChecks();
      
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
    handleSetMapRef
  };
}
