
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
  const markerPresenceCheckerRef = useRef<number | null>(null);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (flyTimerRef.current !== null) clearTimeout(flyTimerRef.current);
      if (initCheckTimerRef.current !== null) clearTimeout(initCheckTimerRef.current);
      if (markerPresenceCheckerRef.current !== null) clearInterval(markerPresenceCheckerRef.current);
    };
  }, []);

  // Set up marker presence checker to continuously reinforce flags when markers exist
  useEffect(() => {
    // Check for marker presence and reinforce flags if needed
    const checkForMarkers = () => {
      const tempMarkerPosition = localStorage.getItem('tempMarkerPosition');
      
      if (tempMarkerPosition || window.tempMarkerPlaced) {
        console.log('Marker detected, reinforcing interaction flags');
        window.userHasInteracted = true;
        window.tempMarkerPlaced = true;
      }
    };
    
    // Initial check
    checkForMarkers();
    
    // Set up interval for continuous checking
    markerPresenceCheckerRef.current = window.setInterval(checkForMarkers, 1000);
    
    return () => {
      if (markerPresenceCheckerRef.current !== null) {
        clearInterval(markerPresenceCheckerRef.current);
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
    
    // Check for marker presence before proceeding
    const tempMarkerPosition = localStorage.getItem('tempMarkerPosition');
    
    // Super aggressive check - if ANY of these conditions are true, skip navigation completely
    if (
      window.tempMarkerPlaced || 
      window.userHasInteracted || 
      userInteractionRef.current || 
      tempMarkerPosition ||
      document.querySelectorAll('.leaflet-marker-icon').length > 0
    ) {
      console.log('Marker detected or user interaction recorded, skipping ALL automatic navigation');
      return;
    }
    
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
    
    console.log('Selected location in Leaflet map:', selectedLocation);
    const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
    
    // Wait for map to be fully initialized before flying
    initCheckTimerRef.current = window.setTimeout(() => {
      try {
        // One more check for user interaction or marker presence
        if (
          window.userHasInteracted || 
          window.tempMarkerPlaced ||
          userInteractionRef.current ||
          document.querySelectorAll('.leaflet-marker-icon').length > 0 ||
          localStorage.getItem('tempMarkerPosition')
        ) {
          console.log('Late detection: User interaction or marker detected, skipping automatic navigation');
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
      } catch (error) {
        console.error('Error in map navigation:', error);
      }
    }, 1500); // Much longer initial delay
    
    return () => {
      // Clean up timers
      if (flyTimerRef.current !== null) clearTimeout(flyTimerRef.current);
      if (initCheckTimerRef.current !== null) clearTimeout(initCheckTimerRef.current);
    };
  }, [selectedLocation, map, initialNavigationDone]);
};
