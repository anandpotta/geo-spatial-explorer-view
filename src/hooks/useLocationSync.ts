
import { useRef, useEffect, useState } from 'react';
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
  const timeoutRefsRef = useRef<number[]>([]);
  const [hasInitialPositioning, setHasInitialPositioning] = useState(false);

  // Clear all timeouts on unmount or when dependencies change
  useEffect(() => {
    return () => {
      // Clear any pending timeouts to prevent memory leaks and stale updates
      timeoutRefsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefsRef.current = [];
      flyInProgressRef.current = false;
    };
  }, [map]);

  useEffect(() => {
    if (!selectedLocation || !map || !isMapReady) return;

    // Create a location identifier to track changes
    const locationId = `${selectedLocation.id}:${selectedLocation.y}:${selectedLocation.x}`;

    // Skip if it's the same location we're already at
    if (locationId === processedLocationRef.current && hasInitialPositioning) {
      console.log('Leaflet map: Skipping duplicate location selection', locationId);
      return;
    }

    // Skip if fly is already in progress
    if (flyInProgressRef.current) {
      console.log('Leaflet map: Fly already in progress, will try again later');
      
      // Queue the operation by setting a timeout
      const timer = setTimeout(() => {
        if (locationId === processedLocationRef.current) {
          console.log('Leaflet map: Skipping deferred update - location already processed');
          return;
        }
        processLocationChange();
      }, 1200);
      
      // Store timeout ID for cleanup
      timeoutRefsRef.current.push(timer);
      return;
    }

    processLocationChange();

    function processLocationChange() {
      // Update location reference and set fly in progress
      console.log(`Leaflet map: Flying to location ${selectedLocation.label || 'Unnamed'} at [${selectedLocation.y}, ${selectedLocation.x}]`);
      processedLocationRef.current = locationId;
      flyInProgressRef.current = true;

      try {
        // Force map invalidation to ensure proper rendering
        const invalidateTimer = setTimeout(() => {
          if (!map) return;
          map.invalidateSize(true);
        }, 100);
        timeoutRefsRef.current.push(invalidateTimer);
        
        // Position the map at the selected location
        const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
        
        // Use setView with animation disabled first to ensure correct positioning
        map.setView(newPosition, 14, { animate: false });
        
        // Then use flyTo for smoother animation
        const flyTimer = setTimeout(() => {
          if (!map) {
            flyInProgressRef.current = false;
            return;
          }
          
          map.flyTo(newPosition, 14, {
            animate: true,
            duration: 1.5,
            easeLinearity: 0.5
          });
          
          // Add a marker after a short delay
          const markerTimer = setTimeout(() => {
            if (!map) {
              flyInProgressRef.current = false;
              return;
            }

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
              setHasInitialPositioning(true);
              
              toast({
                title: "Location Found",
                description: `Navigated to ${selectedLocation.label || 'coordinates'}: ${newPosition[0].toFixed(6)}, ${newPosition[1].toFixed(6)}`,
                duration: 3000,
              });
            } catch (err) {
              console.error('Error adding location marker:', err);
              flyInProgressRef.current = false;
            }
          }, 500);
          timeoutRefsRef.current.push(markerTimer);
        }, 300);
        timeoutRefsRef.current.push(flyTimer);
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
  }, [selectedLocation, map, isMapReady, hasInitialPositioning]);
}
