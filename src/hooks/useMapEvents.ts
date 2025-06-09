
import { useEffect } from 'react';
import L from 'leaflet';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  useEffect(() => {
    if (selectedLocation && map) {
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      
      // Check if map is valid before attempting to fly to location
      if (map && typeof map.flyTo === 'function') {
        try {
          // Prevent event loops during navigation
          const currentCenter = map.getCenter();
          const distance = Math.abs(currentCenter.lat - newPosition[0]) + Math.abs(currentCenter.lng - newPosition[1]);
          
          // Only fly if the distance is significant to prevent unnecessary updates
          if (distance > 0.001) {
            map.flyTo(newPosition, 18, {
              animate: true,
              duration: 1.5
            });
          }
        } catch (error) {
          console.error('Error flying to position:', error);
        }
      }
    }
  }, [selectedLocation, map]);
};
