
import { useEffect } from 'react';
import L from 'leaflet';

/**
 * Hook to handle map cleanup
 */
export function useMapCleanup(
  mapRef: React.MutableRefObject<L.Map | null>,
  mapAttachedRef: React.MutableRefObject<boolean>,
  setIsMapReady: (ready: boolean) => void,
  cleanupValidityChecks: () => void,
  cleanupFly: () => void
) {
  useEffect(() => {
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
      cleanupValidityChecks();
      cleanupFly();
    };
  }, [mapRef, mapAttachedRef, setIsMapReady, cleanupValidityChecks, cleanupFly]);
}
