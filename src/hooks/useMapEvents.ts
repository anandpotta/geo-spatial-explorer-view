
import { useEffect } from 'react';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  useEffect(() => {
    if (selectedLocation && map) {
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      
      // Check if map is valid before attempting to fly to location
      if (map && typeof map.flyTo === 'function') {
        try {
          console.log(`Flying leaflet map to: ${newPosition[0]}, ${newPosition[1]}`);
          map.flyTo(newPosition, 15, {
            animate: true,
            duration: 1.5,
            easeLinearity: 0.5
          });
          
          // Ensure the map is fully rendering
          map.invalidateSize();
          
          // Add a marker at the selected location
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
              if (!markerExists) {
                const marker = L.marker(newPosition).addTo(map);
                marker.bindPopup(`<b>${selectedLocation.x}, ${selectedLocation.y}</b>`).openPopup();
              }
            } catch (err) {
              console.error('Error adding marker:', err);
            }
          }, 1000);
          
          // Toast notification for successful navigation
          toast({
            title: "Location Found",
            description: `Navigated to coordinates: ${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`,
            duration: 3000,
          });
          
        } catch (error) {
          console.error('Error flying to position:', error);
          toast({
            title: "Navigation Error",
            description: "Could not fly to the selected location",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
    }
  }, [selectedLocation, map]);
};
