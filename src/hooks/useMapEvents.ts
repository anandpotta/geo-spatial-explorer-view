
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  const flyAttemptRef = useRef(0);
  const maxFlyAttempts = 5;
  
  useEffect(() => {
    if (!selectedLocation || !map) return;
    
    console.log('Selected location in Leaflet map:', selectedLocation);
    const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
    
    // Reset fly attempts counter when location changes
    flyAttemptRef.current = 0;
    
    // Function to attempt flying to the location
    const attemptFly = () => {
      if (flyAttemptRef.current >= maxFlyAttempts) {
        console.log('Max fly attempts reached, giving up');
        return;
      }
      
      try {
        // Check if map is valid before attempting to fly to location
        if (map && 
            typeof map.flyTo === 'function' && 
            map.getContainer && 
            map.getContainer() && 
            document.body.contains(map.getContainer())) {
          
          map.flyTo(newPosition, 18, {
            animate: true,
            duration: 1.5
          });
          
          console.log('Successfully flew to position');
        } else {
          // If map is not ready yet, try again after a delay
          console.log('Map not ready for flying, attempt:', flyAttemptRef.current + 1);
          flyAttemptRef.current++;
          setTimeout(attemptFly, 500);
        }
      } catch (error) {
        console.error('Error flying to position:', error);
        
        // Try again after a delay
        flyAttemptRef.current++;
        setTimeout(attemptFly, 500);
      }
    };
    
    // Start the first attempt with a delay to ensure map is initialized
    setTimeout(attemptFly, 800);
    
    // Clean up any pending attempts on unmount or when location changes
    return () => {
      flyAttemptRef.current = maxFlyAttempts; // Prevent further attempts
    };
  }, [selectedLocation, map]);
};

export default useMapEvents;
