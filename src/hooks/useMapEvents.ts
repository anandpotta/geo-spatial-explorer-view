
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { isMapValid } from '@/utils/leaflet-type-utils';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyInProgressRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const mapInitializedRef = useRef(false);
  
  // Add effect to check map initialization
  useEffect(() => {
    if (map && isMapValid(map)) {
      // Check if map is properly initialized
      try {
        const container = map.getContainer();
        if (container && document.body.contains(container)) {
          mapInitializedRef.current = true;
          console.log('Map is fully initialized and ready for operations');
        }
      } catch (err) {
        console.warn('Map initialization check failed:', err);
      }
    }
    
    return () => {
      mapInitializedRef.current = false;
    };
  }, [map]);
  
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
    
    // Wait for map to be fully initialized
    if (!mapInitializedRef.current) {
      console.log('Map not fully initialized yet, delaying fly operation');
      const initCheckInterval = setInterval(() => {
        try {
          if (map && isMapValid(map)) {
            const container = map.getContainer();
            if (container && document.body.contains(container) && map._leaflet_id) {
              clearInterval(initCheckInterval);
              mapInitializedRef.current = true;
              performFlyOperation();
            }
          }
        } catch (err) {
          console.log('Still waiting for map initialization...');
        }
      }, 250);
      
      // Safety timeout to prevent endless interval
      setTimeout(() => {
        clearInterval(initCheckInterval);
        if (!mapInitializedRef.current) {
          console.warn('Map initialization timeout - canceling fly operation');
          toast({
            title: "Map Error",
            description: "Could not navigate to location - the map is not ready",
            variant: "destructive",
            duration: 3000,
          });
        }
      }, 5000);
      
      return;
    }
    
    performFlyOperation();
    
    function performFlyOperation() {
      // Update location reference
      lastLocationRef.current = locationId;
      
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      
      // Double-check if map is valid before attempting to fly to location
      if (map && isMapValid(map)) {
        try {
          console.log(`Flying leaflet map to: ${newPosition[0]}, ${newPosition[1]}`);
          
          // Set flag to prevent multiple flies
          flyInProgressRef.current = true;
          
          // Ensure the map is fully rendered before flying
          map.invalidateSize();
          
          // Safety check for map panes and ensure position before flying
          if (!map.getPanes() || !map._mapPane || !map._mapPane._leaflet_pos) {
            console.warn('Map panes not ready, delaying fly operation');
            setTimeout(() => {
              if (map && isMapValid(map)) {
                map.setView(newPosition, 15, { animate: false });
                addMarkerAfterDelay(newPosition);
              }
            }, 500);
            return;
          }
          
          // Fly to the location with gentle animation
          map.flyTo(newPosition, 15, {
            animate: true,
            duration: 1.5,
            easeLinearity: 0.5
          });
          
          // Add a marker after the fly completes
          addMarkerAfterDelay(newPosition);
          
          // Toast notification for successful navigation
          toast({
            title: "Location Found",
            description: `Navigated to coordinates: ${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`,
            duration: 3000,
          });
          
        } catch (error) {
          console.error('Error flying to position:', error);
          flyInProgressRef.current = false;
          
          // Fallback to setView if flyTo fails
          try {
            console.log('Falling back to setView due to fly error');
            map.setView(newPosition, 15, { animate: false });
            addMarkerAfterDelay(newPosition);
          } catch (fallbackError) {
            console.error('Fallback navigation also failed:', fallbackError);
            toast({
              title: "Navigation Error",
              description: "Could not navigate to the selected location",
              variant: "destructive",
              duration: 3000,
            });
          }
        }
      }
    }
    
    function addMarkerAfterDelay(position: [number, number]) {
      setTimeout(() => {
        try {
          if (!map || !isMapValid(map)) {
            flyInProgressRef.current = false;
            return;
          }
          
          // First check if we already have a marker for this location
          let markerExists = false;
          map.eachLayer((layer) => {
            if (layer instanceof L.Marker && layer.getLatLng) {
              const pos = layer.getLatLng();
              if (Math.abs(pos.lat - position[0]) < 0.0001 && 
                  Math.abs(pos.lng - position[1]) < 0.0001) {
                markerExists = true;
              }
            }
          });
          
          // If no marker exists, add one
          if (!markerExists && map) {
            const marker = L.marker(position).addTo(map);
            marker.bindPopup(`<b>Selected Location</b><br>${selectedLocation?.x.toFixed(4)}, ${selectedLocation?.y.toFixed(4)}`).openPopup();
          }
          
          // Reset the fly progress flag
          flyInProgressRef.current = false;
        } catch (err) {
          console.error('Error adding marker:', err);
          flyInProgressRef.current = false;
        }
      }, 1500); // Wait for fly animation to complete
    }
    
    // Cleanup function
    return () => {
      flyInProgressRef.current = false;
    };
  }, [selectedLocation, map]);
};
