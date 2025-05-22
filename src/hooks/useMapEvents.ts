
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { isMapValid } from '@/utils/leaflet-type-utils';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyInProgressRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const flyAttemptsRef = useRef(0);
  const maxFlyAttempts = 3;
  
  // Add a function to safely get the map center
  const safeGetMapCenter = useCallback((mapInstance: L.Map | null): L.LatLng | null => {
    if (!mapInstance) return null;
    
    try {
      // Check if map panes and mapPane exist
      if (!mapInstance.getPane('mapPane') || !(mapInstance.getPane('mapPane') as any)._leaflet_pos) {
        console.warn('Map pane or _leaflet_pos not available yet');
        return null;
      }
      
      return mapInstance.getCenter();
    } catch (err) {
      console.error('Error getting map center:', err);
      return null;
    }
  }, []);
  
  // Add a function to safely fly to location
  const safeFlyTo = useCallback((mapInstance: L.Map, position: [number, number], zoom: number): boolean => {
    if (!mapInstance || !isMapValid(mapInstance)) return false;
    
    try {
      // First check if panes are initialized
      if (!mapInstance.getPane('mapPane') || !(mapInstance.getPane('mapPane') as any)._leaflet_pos) {
        console.log('Map panes not ready for flying, forcing invalidation');
        mapInstance.invalidateSize(true);
        return false;
      }
      
      // Then fly
      mapInstance.flyTo(position, zoom, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.5
      });
      
      return true;
    } catch (err) {
      console.error('Error flying to position:', err);
      return false;
    }
  }, []);
  
  useEffect(() => {
    if (!selectedLocation || !map) return;
    
    // Create a location ID for comparison
    const locationId = `${selectedLocation.y}-${selectedLocation.x}`;
    
    // Skip if it's the same location we're already at
    if (locationId === lastLocationRef.current) {
      console.log('Leaflet map: Skipping duplicate location selection');
      return;
    }
    
    // Skip if fly is already in progress
    if (flyInProgressRef.current) {
      console.log('Leaflet map: Fly already in progress, skipping');
      return;
    }
    
    // Update location reference
    lastLocationRef.current = locationId;
    
    console.log('Selected location in Leaflet map:', selectedLocation);
    const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
    
    // Check if map is valid before attempting to fly to location
    if (map && isMapValid(map)) {
      try {
        console.log(`Attempting to fly leaflet map to: ${newPosition[0]}, ${newPosition[1]}`);
        
        // Set flag to prevent multiple flies
        flyInProgressRef.current = true;
        flyAttemptsRef.current = 0;
        
        // Ensure the map is fully rendered before flying
        map.invalidateSize(true);
        
        // Try to fly with retry logic
        const attemptFly = () => {
          if (flyAttemptsRef.current >= maxFlyAttempts) {
            console.log('Max fly attempts reached, stopping attempts');
            flyInProgressRef.current = false;
            return;
          }
          
          flyAttemptsRef.current++;
          console.log(`Fly attempt ${flyAttemptsRef.current}/${maxFlyAttempts}`);
          
          const flySuccessful = safeFlyTo(map, newPosition, 15);
          
          if (flySuccessful) {
            // Add a marker after the fly completes
            setTimeout(() => {
              try {
                // First check if we already have a marker for this location
                let markerExists = false;
                
                if (isMapValid(map)) {
                  map.eachLayer((layer) => {
                    if (layer instanceof L.Marker && layer.getLatLng) {
                      const pos = layer.getLatLng();
                      if (Math.abs(pos.lat - newPosition[0]) < 0.0001 && 
                          Math.abs(pos.lng - newPosition[1]) < 0.0001) {
                        markerExists = true;
                      }
                    }
                  });
                  
                  // If no marker exists, add one
                  if (!markerExists) {
                    const marker = L.marker(newPosition).addTo(map);
                    marker.bindPopup(`<b>Selected Location</b><br>${selectedLocation.x.toFixed(4)}, ${selectedLocation.y.toFixed(4)}`).openPopup();
                  }
                }
                
                // Reset the fly progress flag
                flyInProgressRef.current = false;
              } catch (err) {
                console.error('Error adding marker:', err);
                flyInProgressRef.current = false;
              }
            }, 1500); // Wait for fly animation to complete
            
            // Toast notification for successful navigation
            toast({
              title: "Location Found",
              description: `Navigated to coordinates: ${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`,
              duration: 3000,
            });
          } else {
            // If fly failed, try again after a short delay
            console.log('Fly attempt failed, retrying after delay');
            setTimeout(() => {
              if (map && isMapValid(map)) {
                map.invalidateSize(true);
                attemptFly();
              } else {
                flyInProgressRef.current = false;
              }
            }, 500);
          }
        };
        
        // Start the first attempt
        attemptFly();
        
      } catch (error) {
        console.error('Error flying to position:', error);
        flyInProgressRef.current = false;
        toast({
          title: "Navigation Error",
          description: "Could not fly to the selected location",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      console.warn('Map not valid or ready for flying to location');
      flyInProgressRef.current = false;
    }
    
    // Cleanup function
    return () => {
      flyInProgressRef.current = false;
      flyAttemptsRef.current = 0;
    };
  }, [selectedLocation, map, safeFlyTo]);
  
  return {
    lastLocation: lastLocationRef.current,
    flyInProgress: flyInProgressRef.current
  };
};
