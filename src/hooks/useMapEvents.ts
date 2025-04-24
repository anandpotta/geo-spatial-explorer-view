
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
  const lastCheckRef = useRef<number>(0);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (flyTimerRef.current !== null) clearTimeout(flyTimerRef.current);
      if (initCheckTimerRef.current !== null) clearTimeout(initCheckTimerRef.current);
      if (markerPresenceCheckerRef.current !== null) clearInterval(markerPresenceCheckerRef.current);
    };
  }, []);

  // Set up marker presence checker - but with rate limiting to prevent excessive updates
  useEffect(() => {
    // Check for marker presence and reinforce flags if needed
    const checkForMarkers = () => {
      // Rate limit checks to once per second
      const now = Date.now();
      if (now - lastCheckRef.current < 1000) {
        return;
      }
      lastCheckRef.current = now;
      
      const tempMarkerPosition = localStorage.getItem('tempMarkerPosition');
      
      if (tempMarkerPosition || window.tempMarkerPlaced) {
        console.log('Marker detected, reinforcing interaction flags');
        window.userHasInteracted = true;
        window.tempMarkerPlaced = true;
      }
    };
    
    // Initial check
    checkForMarkers();
    
    // Set up interval for continuous checking - longer interval to reduce rendering pressure
    markerPresenceCheckerRef.current = window.setInterval(checkForMarkers, 2000);
    
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

  // Handle automatic navigation (this is the critical section for preventing infinite loops)
  useEffect(() => {
    // Skip if dependencies aren't available
    if (!selectedLocation || !map) return;
    
    // If a marker is already placed, skip navigation entirely
    if (window.tempMarkerPlaced || window.userHasInteracted || localStorage.getItem('tempMarkerPosition')) {
      console.log('Marker detected or user interaction recorded, skipping ALL automatic navigation');
      if (initialNavigationDone) {
        initialNavigationDone.current = true;
      }
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
    
    // Perform only a single navigation attempt to avoid repeat renders
    initializedRef.current = true;
    
    // Wait for map to be fully initialized before flying
    initCheckTimerRef.current = window.setTimeout(() => {
      try {
        // Final safety check for user interaction or marker presence
        if (window.userHasInteracted || window.tempMarkerPlaced || localStorage.getItem('tempMarkerPosition')) {
          console.log('Late detection: User interaction or marker detected, skipping automatic navigation');
          return;
        }
        
        // Skip if the map is no longer available
        if (!map || !map.getContainer() || !document.body.contains(map.getContainer())) {
          console.log('Map not fully initialized for navigation, skipping');
          return;
        }
        
        // First invalidate size to ensure proper rendering
        map.invalidateSize(true);
        
        // Set view with no animation to prevent render issues
        try {
          map.setView(newPosition, 18, { animate: false });
          
          // Mark navigation as done
          if (initialNavigationDone) {
            initialNavigationDone.current = true;
          }
        } catch (setViewErr) {
          console.warn('Error setting initial view:', setViewErr);
        }
      } catch (error) {
        console.error('Error in map navigation:', error);
      }
    }, 1500);
    
    return () => {
      if (initCheckTimerRef.current !== null) clearTimeout(initCheckTimerRef.current);
    };
  }, [selectedLocation, map, initialNavigationDone]);
};
