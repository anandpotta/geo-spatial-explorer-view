
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
          map.flyTo(newPosition, 18, {
            animate: true,
            duration: 1.5
          });
        } catch (error) {
          console.error('Error flying to position:', error);
        }
      }
    }
  }, [selectedLocation, map]);
};
