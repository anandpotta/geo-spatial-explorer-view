
import { useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { toast } from '@/components/ui/use-toast';
import L from 'leaflet';

export function useLocationSync(
  map: L.Map | null,
  selectedLocation?: Location,
  isMapReady: boolean = false
) {
  const processedLocationRef = useRef<string | null>(null);
  const flyInProgressRef = useRef(false);

  useEffect(() => {
    if (!selectedLocation || !map || !isMapReady) return;

    // Create a location identifier to track changes
    const locationId = `${selectedLocation.id}:${selectedLocation.y}:${selectedLocation.x}`;

    // Skip if it's the same location we're already at
    if (locationId === processedLocationRef.current) {
      console.log('Leaflet map: Skipping duplicate location selection', locationId);
      return;
    }

    // Skip if fly is already in progress
    if (flyInProgressRef.current) {
      console.log('Leaflet map: Fly already in progress, queuing');
      
      // Queue the operation by setting a timeout
      const timer = setTimeout(() => {
        processLocationChange();
      }, 1000);
      
      return () => clearTimeout(timer);
    }

    processLocationChange();

    function processLocationChange() {
      // Update location reference and set fly in progress
      console.log(`Leaflet map: Flying to location ${selectedLocation.label || 'Unnamed'} at [${selectedLocation.y}, ${selectedLocation.x}]`);
      processedLocationRef.current = locationId;
      flyInProgressRef.current = true;

      try {
        // Ensure the map is properly initialized and visible
        map.invalidateSize();
        
        // Position the map at the selected location
        const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
        
        // Use higher zoom level and slower animation for more precise positioning
        map.flyTo(newPosition, 14, {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.5
        });

        // Add a marker for the location after the fly animation completes
        setTimeout(() => {
          try {
            // Clear existing markers to prevent cluttering
            map.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                map.removeLayer(layer);
              }
            });

            // Add a new marker at the precise location
            const marker = L.marker(newPosition).addTo(map);
            marker.bindPopup(
              `<b>${selectedLocation.label || 'Selected Location'}</b><br>` +
              `${selectedLocation.y.toFixed(6)}, ${selectedLocation.x.toFixed(6)}`
            ).openPopup();
            
            // Reset the fly progress flag
            flyInProgressRef.current = false;
            
            toast({
              title: "Location Found",
              description: `Navigated to ${selectedLocation.label || 'coordinates'}: ${newPosition[0].toFixed(6)}, ${newPosition[1].toFixed(6)}`,
              duration: 3000,
            });
          } catch (err) {
            console.error('Error adding location marker:', err);
            flyInProgressRef.current = false;
          }
        }, 1600); // Wait until fly animation completes
      } catch (error) {
        console.error('Error flying to location in Leaflet:', error);
        flyInProgressRef.current = false;
        toast({
          title: "Navigation Error",
          description: "Could not navigate to the selected location",
          variant: "destructive",
          duration: 3000,
        });
      }
    }

    // Cleanup function
    return () => {
      // Reset fly in progress if component unmounts during fly
      if (flyInProgressRef.current) {
        flyInProgressRef.current = false;
      }
    };
  }, [selectedLocation, map, isMapReady]);
}
