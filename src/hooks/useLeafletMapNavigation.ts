
import { useCallback, useRef } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { toast } from 'sonner';

export const useLeafletMapNavigation = () => {
  // Keep track of whether we've already navigated to a location
  const initialNavigationDone = useRef(false);
  
  const safeMapFlyTo = useCallback((
    map: L.Map | null,
    isMapInitialized: boolean,
    cleanupInProgress: boolean,
    lat: number,
    lng: number,
    zoom: number = 18,
    forceNavigation: boolean = false
  ): boolean => {
    // Early return if basic conditions aren't met
    if (!map || !isMapInitialized || cleanupInProgress) {
      console.log('Map not initialized for flyTo');
      return false;
    }
    
    // Check for user interaction flags
    if (!forceNavigation && (window.userHasInteracted || window.tempMarkerPlaced)) {
      console.log('User has interacted with map or placed a marker, skipping automatic flyTo');
      return true; // Return true to prevent map recreation
    }
    
    // Skip navigation if we've already done initial navigation (unless forced)
    if (initialNavigationDone.current && !forceNavigation) {
      console.log('Initial navigation already done, skipping automatic flyTo');
      return true;
    }
    
    try {
      // Ensure map container exists and is in DOM
      if (!map.getContainer() || !document.body.contains(map.getContainer())) {
        console.warn('Map container not available for flyTo');
        return false;
      }
      
      // Make sure essential map elements are available
      const mapPane = map.getContainer().querySelector('.leaflet-map-pane');
      if (!mapPane) {
        console.warn('Map pane not found, map may not be ready for flyTo');
        return false;
      }
      
      // Update map size first to ensure proper rendering
      map.invalidateSize(true);
      
      // Set view immediately (more reliable than flyTo)
      map.setView([lat, lng], zoom, { animate: false });
      
      // Mark that initial navigation is done
      initialNavigationDone.current = true;
      
      // Add a slight delay before attempting the animated flyTo
      setTimeout(() => {
        try {
          // Double check map is still available before animating
          // And check that user hasn't interacted with map during the delay
          if (!map || cleanupInProgress || (!forceNavigation && (window.userHasInteracted || window.tempMarkerPlaced))) return;
          
          if (map.getContainer() && document.body.contains(map.getContainer())) {
            // Now attempt the smooth animation
            map.flyTo([lat, lng], zoom, {
              animate: true,
              duration: 1.5
            });
          }
        } catch (flyErr) {
          console.warn('Error during flyTo, but position should be set:', flyErr);
        }
      }, 800); // Increased timeout for better reliability
      
      return true;
    } catch (err) {
      console.error('Error in safeMapFlyTo outer block:', err);
      return false;
    }
  }, []);

  const handleLocationSelect = useCallback((
    position: [number, number],
    onLocationSelect?: (location: Location) => void
  ) => {
    const [lat, lng] = position;
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates:', { lat, lng });
      toast.error('Invalid location coordinates');
      return;
    }

    if (onLocationSelect) {
      const location: Location = {
        id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        label: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        y: lat,
        x: lng
      };
      onLocationSelect(location);
    }
  }, []);

  const resetNavigationState = useCallback(() => {
    initialNavigationDone.current = false;
  }, []);

  return {
    safeMapFlyTo,
    handleLocationSelect,
    resetNavigationState,
    initialNavigationDone
  };
};
