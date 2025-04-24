
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
    // Skip if dependencies aren't available
    if (!selectedLocation || !map) return;
    
    // Only proceed if map isn't already initialized
    if (initializedRef.current) {
      console.log('Map already initialized, skipping redundant navigation');
      return;
    }
    
    console.log('Selected location in Leaflet map:', selectedLocation);
    const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
    
    // Wait for map to be fully initialized before flying
    // Use a much longer delay to ensure map is really ready
    initCheckTimerRef.current = window.setTimeout(() => {
      try {
        // Skip if the map is no longer available
        if (!map || !map.getContainer() || !document.body.contains(map.getContainer())) {
          console.log('Map not fully initialized for navigation, skipping');
          return;
        }
        
        // Mark as initialized to prevent multiple navigation attempts
        initializedRef.current = true;
        
        // First invalidate size to ensure proper rendering
        map.invalidateSize(true);
        
        // Set view first for immediate position update
        try {
          map.setView(newPosition, 18, { animate: false });
        } catch (setViewErr) {
          console.warn('Error setting initial view:', setViewErr);
        }
        
        // Small delay before attempting smooth animation
        flyTimerRef.current = window.setTimeout(() => {
          try {
            // Skip flying if map was unmounted
            if (!map.getContainer() || !document.body.contains(map.getContainer())) {
              console.log('Map container no longer in DOM, skipping navigation');
              return;
            }
            
            // Try flyTo for a smoother animation
            map.flyTo(newPosition, 18, {
              animate: true,
              duration: 1.5
            });
          } catch (flyToErr) {
            console.warn('Error during flyTo, but location should be set:', flyToErr);
          }
        }, 1000); // Increased timeout for more reliability
      } catch (error) {
        console.error('Error in map navigation:', error);
      }
    }, 1500); // Much longer initial delay
    
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
