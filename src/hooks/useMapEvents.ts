
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export const useMapEvents = (
  map: L.Map | null, 
  selectedLocation?: { x: number; y: number },
  initialNavigationDone?: React.MutableRefObject<boolean>
) => {
  const flyTimerRef = useRef<number | null>(null);
  const initCheckTimerRef = useRef<number | null>(null);
  const initializedRef = useRef<boolean>(false);
  const userInteractionRef = useRef<boolean>(false);
  
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

  // Track user interactions with the map
  useEffect(() => {
    if (!map) return;
    
    const handleUserInteraction = () => {
      userInteractionRef.current = true;
      window.userHasInteracted = true; // Set global flag
      console.log('User has manually interacted with map, disabling auto-centering');
    };
    
    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('click', handleUserInteraction);
    
    return () => {
      map.off('dragstart', handleUserInteraction);
      map.off('zoomstart', handleUserInteraction);
      map.off('click', handleUserInteraction);
    };
  }, [map]);

  useEffect(() => {
    // Skip if dependencies aren't available
    if (!selectedLocation || !map) return;
    
    // Only proceed if map isn't already initialized
    if (initializedRef.current) {
      console.log('Map already initialized, skipping redundant navigation');
      return;
    }
    
    // Check if initial navigation is already done
    if (initialNavigationDone?.current) {
      console.log('Initial navigation already done, skipping automatic map recentering');
      return;
    }
    
    // Skip if user has manually interacted with the map or placed a marker
    if (userInteractionRef.current || window.userHasInteracted || window.tempMarkerPlaced) {
      console.log('User has manually positioned the map or placed a marker, skipping automatic centering');
      return;
    }
    
    console.log('Selected location in Leaflet map:', selectedLocation);
    const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
    
    // Wait for map to be fully initialized before flying
    // Use a much longer delay to ensure map is really ready
    initCheckTimerRef.current = window.setTimeout(() => {
      try {
        // Skip if the user has interacted with the map by now
        if (window.userHasInteracted || window.tempMarkerPlaced) {
          console.log('User interaction detected, skipping automatic navigation');
          return;
        }
        
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
          
          // If we have the initialNavigationDone ref, mark it as done
          if (initialNavigationDone) {
            initialNavigationDone.current = true;
          }
        } catch (setViewErr) {
          console.warn('Error setting initial view:', setViewErr);
        }
        
        // Skip animated flyTo to reduce map reset issues
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
  }, [selectedLocation, map, initialNavigationDone]);
};
