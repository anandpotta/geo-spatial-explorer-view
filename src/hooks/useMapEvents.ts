
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyTimerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Clean up any pending timers
    return () => {
      if (flyTimerRef.current !== null) {
        clearTimeout(flyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedLocation && map) {
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      
      // Only proceed if map is properly initialized
      if (map && typeof map.flyTo === 'function' && map.getContainer()) {
        try {
          // First invalidate size to ensure proper rendering
          map.invalidateSize(true);
          
          // Wait for DOM to be fully ready before attempting navigation
          if (flyTimerRef.current !== null) {
            clearTimeout(flyTimerRef.current);
          }
          
          flyTimerRef.current = window.setTimeout(() => {
            flyTimerRef.current = null;
            
            try {
              // Verify map is still valid before flying
              if (map && map.getContainer()) {
                // Check if we can safely get center (which uses _leaflet_pos internally)
                try {
                  // This will fail if _leaflet_pos is undefined
                  const center = map.getCenter();
                  
                  // If we got here, we can safely use flyTo
                  map.flyTo(newPosition, 18, {
                    animate: true,
                    duration: 1.5
                  });
                } catch (centerError) {
                  console.warn('Unable to get map center, falling back to setView:', centerError);
                  map.setView(newPosition, 18);
                }
              }
            } catch (innerError) {
              console.error('Error in delayed flyTo:', innerError);
              
              // Fallback to setView which is more reliable
              try {
                map.setView(newPosition, 18);
              } catch (setViewError) {
                console.error('Error in setView fallback:', setViewError);
              }
            }
          }, 300); // Increased timeout for better stability
        } catch (error) {
          console.error('Error flying to position:', error);
          
          // Fallback to setView which is more reliable
          try {
            map.setView(newPosition, 18);
          } catch (setViewError) {
            console.error('Error in setView fallback:', setViewError);
          }
        }
      } else {
        console.warn('Map not ready for navigation');
      }
    }
    
    return () => {
      if (flyTimerRef.current !== null) {
        clearTimeout(flyTimerRef.current);
        flyTimerRef.current = null;
      }
    };
  }, [selectedLocation, map]);
};
