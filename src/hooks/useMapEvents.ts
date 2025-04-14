
import { useEffect } from 'react';
import L from 'leaflet';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  useEffect(() => {
    if (selectedLocation && map) {
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      map.flyTo(newPosition, 18, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedLocation, map]);
};
