
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyTimerRef = useRef<number | null>(null);
  const initCheckTimerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Clean up any pending timers
    return () => {
      if (flyTimerRef.current !== null) {
        clearTimeout(flyTimerRef.current);
      }
      if (initCheckTimerRef.current !== null) {
        clearTimeout(initCheckTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedLocation || !map) return;
    
    console.log('Selected location in Leaflet map:', selectedLocation);
    const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
    
    // Wait for map to be fully initialized before flying
    const checkAndFly = () => {
      try {
        // If the map is not initialized or doesn't have a container, try again later
        if (!map || !(map as any).isMapFullyInitialized || !map.getContainer()) {
          console.log('Map not fully initialized for navigation, waiting...');
          initCheckTimerRef.current = window.setTimeout(checkAndFly, 200);
          return;
        }
        
        // First invalidate size to ensure proper rendering
        map.invalidateSize(true);
        
        // Small delay to ensure DOM is ready after invalidation
        flyTimerRef.current = window.setTimeout(() => {
          try {
            // Try setView first which is more reliable than flyTo
            map.setView(newPosition, 18);
            
            // After a short delay, try flyTo for a smoother animation
            setTimeout(() => {
              try {
                if (map && map.getContainer()) {
                  map.flyTo(newPosition, 18, {
                    animate: true,
                    duration: 1.5
                  });
                }
              } catch (flyToErr) {
                console.warn('Error during flyTo, but location should be set:', flyToErr);
                // setView already happened, so we're good
              }
            }, 300);
          } catch (setViewErr) {
            console.error('Error in map navigation:', setViewErr);
          }
        }, 300);
      } catch (error) {
        console.error('Error checking map initialization:', error);
      }
    };
    
    // Start the process
    checkAndFly();
    
    return () => {
      // Clean up timers
      if (flyTimerRef.current !== null) {
        clearTimeout(flyTimerRef.current);
      }
      if (initCheckTimerRef.current !== null) {
        clearTimeout(initCheckTimerRef.current);
      }
    };
  }, [selectedLocation, map]);
};
