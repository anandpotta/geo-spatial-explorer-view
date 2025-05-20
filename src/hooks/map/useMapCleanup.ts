
import { useEffect } from 'react';
import L from 'leaflet';

export function useMapCleanup(
  mapRef: React.RefObject<L.Map | null>,
  mapAttachedRef: React.MutableRefObject<boolean>,
  setIsMapReady: (ready: boolean) => void,
  validityCheckIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>
) {
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        
        try {
          // Store reference to avoid race conditions
          const mapInstance = mapRef.current;
          
          // First, check if map is still valid
          if (mapInstance && typeof mapInstance.remove === 'function') {
            try {
              const container = mapInstance.getContainer();
              
              // Only attempt to remove if the container is still in DOM
              if (container && document.body.contains(container)) {
                console.log('Map container exists and is attached - removing map instance');
                
                // Remove all event listeners first
                mapInstance.off();
                mapInstance.remove();
                
                // Also remove container from DOM to prevent reuse
                if (container.parentElement) {
                  container.parentElement.classList.remove('leaflet-container');
                }
              }
            } catch (e) {
              console.log('Map container already detached or removed', e);
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
        // Clear reference regardless of success
        mapRef.current = null;
        mapAttachedRef.current = false;
        setIsMapReady(false);
        
        // Additional cleanup: remove any orphaned containers
        const orphanedContainers = document.querySelectorAll('.leaflet-container');
        orphanedContainers.forEach(container => {
          if (!document.body.contains(container.parentElement)) {
            container.remove();
          }
        });
      }
      
      // Clear validity check interval
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [mapRef, mapAttachedRef, setIsMapReady, validityCheckIntervalRef]);
}
