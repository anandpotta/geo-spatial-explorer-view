
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyTimerRef = useRef<number | null>(null);
  const initCheckTimerRef = useRef<number | null>(null);
  const initializedRef = useRef<boolean>(false);
  
  // Cleanup timers on unmount
  useEffect(() => {
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
        // Check if the map is ready for operations
        if (!map || !map.getContainer()) {
          console.log('Map not fully initialized for navigation, waiting...');
          initCheckTimerRef.current = window.setTimeout(checkAndFly, 300);
          return;
        }
        
        // Check if the panes and layers are ready
        if (!map.getPanes() || !document.contains(map.getContainer())) {
          console.log('Map panes not ready, waiting...');
          initCheckTimerRef.current = window.setTimeout(checkAndFly, 300);
          return;
        }
        
        // Additional check for map readiness using private properties
        try {
          // Try to access the _mapPane which should have _leaflet_pos
          const mapPane = map.getContainer().querySelector('.leaflet-map-pane');
          if (!mapPane || !(mapPane as any)._leaflet_pos) {
            console.log('Map panes not fully initialized, waiting...');
            initCheckTimerRef.current = window.setTimeout(checkAndFly, 300);
            return;
          }
        } catch (err) {
          // If we can't check, we'll try again
          console.log('Unable to check map panes, waiting...');
          initCheckTimerRef.current = window.setTimeout(checkAndFly, 300);
          return;
        }
        
        // Mark as initialized if we've made it this far
        initializedRef.current = true;
        
        // First invalidate size to ensure proper rendering
        map.invalidateSize(true);
        
        // Small delay to ensure DOM is ready after invalidation
        flyTimerRef.current = window.setTimeout(() => {
          try {
            // Skip flying if map was unmounted
            if (!map.getContainer() || !document.contains(map.getContainer())) {
              console.log('Map container no longer in DOM, skipping navigation');
              return;
            }
            
            // Try setView first which is more reliable than flyTo
            map.setView(newPosition, 18);
            
            // After a short delay, try flyTo for a smoother animation
            setTimeout(() => {
              try {
                if (map && map.getContainer() && document.contains(map.getContainer())) {
                  map.flyTo(newPosition, 18, {
                    animate: true,
                    duration: 1.5
                  });
                }
              } catch (flyToErr) {
                console.warn('Error during flyTo, but location should be set:', flyToErr);
              }
            }, 500);
          } catch (setViewErr) {
            console.error('Error in map navigation:', setViewErr);
          }
        }, 500);
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
