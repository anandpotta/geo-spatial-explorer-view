
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { navigateToLocation } from '@/utils/clear-operations/map-refresh';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyInProgressRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const navigationAttemptsRef = useRef(0);
  const MAX_NAVIGATION_ATTEMPTS = 3;
  
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
    
    // Reset navigation attempts for new location
    navigationAttemptsRef.current = 0;
    
    // Function to attempt navigation with retry logic
    const attemptNavigation = () => {
      // Check if we've exceeded max attempts
      if (navigationAttemptsRef.current >= MAX_NAVIGATION_ATTEMPTS) {
        console.warn('Max navigation attempts reached, giving up');
        flyInProgressRef.current = false;
        
        toast({
          title: "Navigation Issue",
          description: "Could not navigate to the selected location. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Check if map is still valid
      if (!map) {
        console.warn('Map is no longer valid, retrying...');
        navigationAttemptsRef.current++;
        setTimeout(attemptNavigation, 1000);
        return;
      }

      // Check if map is fully initialized
      // Using type assertion to access internal properties safely
      const mapInstance = map as any;
      if (!mapInstance || !mapInstance._loaded) {
        console.warn('Map not fully loaded yet, retrying...');
        navigationAttemptsRef.current++;
        setTimeout(attemptNavigation, 1000);
        return;
      }
      
      navigationAttemptsRef.current++;
      console.log(`Navigation attempt ${navigationAttemptsRef.current} for location: ${newPosition[0]}, ${newPosition[1]}`);
      
      // Set flag to prevent multiple flies
      flyInProgressRef.current = true;
      
      // Check if map is valid before attempting to fly to location
      if (map && typeof map.flyTo === 'function') {
        try {
          // Use the utility function for navigation
          const success = navigateToLocation(map, newPosition[0], newPosition[1], 15);
          
          if (success) {
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
                  marker.bindPopup(`<b>Selected Location</b><br>${selectedLocation.x.toFixed(4)}, ${selectedLocation.y.toFixed(4)}`).openPopup();
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
            console.warn('Navigation not successful, retrying...');
            setTimeout(attemptNavigation, 500); // Retry after a delay
          }
        } catch (error) {
          console.error('Error flying to position:', error);
          flyInProgressRef.current = false;
          
          // Retry navigation after a delay
          setTimeout(attemptNavigation, 1000);
          
          if (navigationAttemptsRef.current >= MAX_NAVIGATION_ATTEMPTS) {
            toast({
              title: "Navigation Error",
              description: "Could not fly to the selected location",
              variant: "destructive",
              duration: 3000,
            });
          }
        }
      } else {
        console.warn('Map not ready for navigation, retrying...');
        setTimeout(attemptNavigation, 1000); // Retry after a delay
      }
    };
    
    // Start navigation attempt
    attemptNavigation();
    
    // Cleanup function
    return () => {
      flyInProgressRef.current = false;
      navigationAttemptsRef.current = 0;
    };
  }, [selectedLocation, map]);
};
