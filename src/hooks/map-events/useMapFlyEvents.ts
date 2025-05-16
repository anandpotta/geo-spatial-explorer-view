
import { useEffect } from 'react';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { useFlyToLocation } from './useFlyToLocation';
import { useMarkerManagement } from './useMarkerManagement';

/**
 * Hook to handle map flying events and related markers
 */
export function useMapFlyEvents(map: L.Map | null, selectedLocation?: { x: number; y: number }) {
  const {
    flyInProgressRef,
    lastLocationRef,
    flyAttemptRef,
    resetFlyAttempt,
    isFlyInProgress,
    setFlyInProgress,
    getLocationId,
    isSameLocation,
    updateLastLocation,
    resetLastLocation
  } = useFlyToLocation();
  
  const { checkMarkerExists, addMarker } = useMarkerManagement();
  
  useEffect(() => {
    if (!selectedLocation) return;
    
    // Reset fly attempt counter when location changes
    resetFlyAttempt();
    
    // Create a location ID for comparison
    const locationId = getLocationId(selectedLocation.y, selectedLocation.x);
    
    // Skip if it's the same location we're already at
    if (isSameLocation(locationId)) {
      console.log('Leaflet map: Skipping duplicate location selection');
      return;
    }
    
    // Skip if fly is already in progress
    if (isFlyInProgress()) {
      console.log('Leaflet map: Fly already in progress, skipping');
      return;
    }
    
    // Skip if map is not available or valid
    if (!map) {
      console.log('Leaflet map: Map not available for flying');
      return;
    }
    
    // Check if map has been initialized completely
    try {
      // Verify map is valid before attempting operations
      if (!isMapValid(map)) {
        console.log('Leaflet map: Map not valid for flying');
        
        // Try again after a delay if attempts are limited
        if (flyAttemptRef.current < 3) {
          flyAttemptRef.current++;
          setTimeout(() => {
            // Force a re-trigger of the effect
            resetLastLocation();
          }, 800 * flyAttemptRef.current); // Progressive backoff
        }
        return;
      }
      
      // Check more specifically if map panes are initialized
      const mapHasPanes = map.getPanes && 
                          map.getPanes().tilePane && 
                          map.getPanes().mapPane;
      
      if (!mapHasPanes) {
        console.log('Leaflet map: Map panes not initialized fully');
        
        // Try again after a delay if attempts are limited
        if (flyAttemptRef.current < 3) {
          flyAttemptRef.current++;
          setTimeout(() => {
            // Force a re-trigger of the effect
            resetLastLocation();
          }, 1000 * flyAttemptRef.current); // Progressive backoff
        }
        return;
      }
      
      // Update location reference
      updateLastLocation(locationId);
      
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      
      // Check if map is valid before attempting to fly to location
      try {
        console.log(`Flying leaflet map to: ${newPosition[0]}, ${newPosition[1]}`);
        
        // Set flag to prevent multiple flies
        setFlyInProgress(true);
        
        // Ensure the map is fully rendered before flying
        map.invalidateSize();
        
        // Fly to the location
        map.flyTo(newPosition, 15, {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.5
        });
        
        // Add a marker after the fly completes
        setTimeout(() => {
          try {
            // Verify map is still valid
            if (!isMapValid(map)) {
              console.warn("Map no longer valid after fly");
              setFlyInProgress(false);
              return;
            }
            
            // First check if we already have a marker for this location
            const markerExists = checkMarkerExists(map, newPosition);
            
            // If no marker exists, add one
            if (!markerExists && isMapValid(map)) {
              const popupContent = `<b>Selected Location</b><br>${selectedLocation.x.toFixed(4)}, ${selectedLocation.y.toFixed(4)}`;
              addMarker(map, newPosition, popupContent);
            }
            
            // Reset the fly progress flag
            setFlyInProgress(false);
          } catch (err) {
            console.error('Error after fly completion:', err);
            setFlyInProgress(false);
          }
        }, 1800); // Wait for fly animation to complete (slightly longer)
        
        // Toast notification for successful navigation
        toast({
          title: "Location Found",
          description: `Navigated to coordinates: ${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`,
          duration: 3000,
        });
        
      } catch (error) {
        console.error('Error flying to position:', error);
        setFlyInProgress(false);
        toast({
          title: "Navigation Error",
          description: "Could not fly to the selected location",
          variant: "destructive",
          duration: 3000,
        });
        
        // Try again after a delay if attempts are limited
        if (flyAttemptRef.current < 3) {
          flyAttemptRef.current++;
          setTimeout(() => {
            // Force a re-trigger of the effect
            resetLastLocation();
          }, 800 * flyAttemptRef.current); // Progressive backoff
        }
      }
    } catch (error) {
      console.error('Error checking map validity:', error);
    }
    
    // Cleanup function
    return () => {
      setFlyInProgress(false);
    };
  }, [selectedLocation, map]);
}
