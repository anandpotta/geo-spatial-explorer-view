
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyInProgressRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const initialFlyTimerRef = useRef<number | null>(null);
  
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
    
    console.log(`Flying to location: ${selectedLocation.y}, ${selectedLocation.x}`);
    const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
    
    // Check if map is valid before attempting to fly to location
    if (map && typeof map.flyTo === 'function') {
      try {
        // Clear any previous scheduled fly
        if (initialFlyTimerRef.current) {
          clearTimeout(initialFlyTimerRef.current);
          initialFlyTimerRef.current = null;
        }
        
        // Ensure the map container exists and is attached to DOM
        if (!document.body.contains(map.getContainer())) {
          console.warn('Map container not attached to DOM, cannot fly');
          return;
        }
        
        // Set flag to prevent multiple flies
        flyInProgressRef.current = true;
        
        // Ensure the map is fully rendered before flying
        map.invalidateSize({animate: false, pan: false});
        
        // Fly to the location with small delay to ensure map is ready
        initialFlyTimerRef.current = window.setTimeout(() => {
          try {
            map.flyTo(newPosition, 15, {
              animate: true,
              duration: 1.5,
              easeLinearity: 0.5
            });
            
            // Add a marker after the fly completes
            setTimeout(() => {
              try {
                // First check if we already have a marker for this location
                let markerExists = false;
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
                if (!markerExists && map) {
                  const marker = L.marker(newPosition).addTo(map);
                  marker.bindPopup(`<b>Selected Location</b><br>${selectedLocation.x.toFixed(6)}, ${selectedLocation.y.toFixed(6)}`).openPopup();
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
        }, 300);
        
      } catch (error) {
        console.error('Error flying to position:', error);
        flyInProgressRef.current = false;
      }
    }
    
    // Cleanup function
    return () => {
      flyInProgressRef.current = false;
      if (initialFlyTimerRef.current) {
        clearTimeout(initialFlyTimerRef.current);
        initialFlyTimerRef.current = null;
      }
    };
  }, [selectedLocation, map]);
};
