
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
  const transitionInProgressRef = useRef(false);
  const isUnmountedRef = useRef(false);

  // Clear all timeouts on unmount or when dependencies change
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      isUnmountedRef.current = true;
      
      // Clear any pending timeouts to prevent memory leaks and stale updates
      timeoutRefsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
      timeoutRefsRef.current = [];
      flyInProgressRef.current = false;
      transitionInProgressRef.current = false;
    };
  }, [map]);

  // Add a safe setTimeout function that tracks timeouts for cleanup
  const safeSetTimeout = (callback: () => void, delay: number): number => {
    const timeoutId = window.setTimeout(() => {
      if (!isUnmountedRef.current) {
        callback();
      }
    }, delay);
    timeoutRefsRef.current.push(timeoutId);
    return timeoutId;
  };

  useEffect(() => {
    if (!selectedLocation || !map || !isMapReady) return;

    // Prevent operations during active transitions
    if (transitionInProgressRef.current) {
      console.log('Leaflet map: View transition in progress, skipping location update');
      return;
    }

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
      const timer = safeSetTimeout(() => {
        if (locationId === processedLocationRef.current) {
          console.log('Leaflet map: Skipping deferred update - location already processed');
          return;
        }
        
        // Only process if component is still mounted
        if (!isUnmountedRef.current) {
          processLocationChange();
        }
      }, 1200);
      
      return;
    }

    processLocationChange();

    function processLocationChange() {
      if (isUnmountedRef.current || !map) return;
      
      // Set transition state
      transitionInProgressRef.current = true;
      
      // Update location reference and set fly in progress
      console.log(`Leaflet map: Flying to location ${selectedLocation.label || 'Unnamed'} at [${selectedLocation.y}, ${selectedLocation.x}]`);
      processedLocationRef.current = locationId;
      flyInProgressRef.current = true;

      try {
        // Force map invalidation to ensure proper rendering
        safeSetTimeout(() => {
          if (!map || isUnmountedRef.current) return;
          map.invalidateSize(true);
        }, 100);
        
        // Position the map at the selected location
        const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
        
        // Use setView with animation disabled first to ensure correct positioning
        map.setView(newPosition, 14, { animate: false });
        
        // Then use flyTo for smoother animation
        safeSetTimeout(() => {
          if (!map || isUnmountedRef.current) {
            flyInProgressRef.current = false;
            transitionInProgressRef.current = false;
            return;
          }
          
          map.flyTo(newPosition, 14, {
            animate: true,
            duration: 1.0, // Reduced for quicker transitions
            easeLinearity: 0.5
          });
          
          // Add a marker after a short delay
          safeSetTimeout(() => {
            if (!map || isUnmountedRef.current) {
              flyInProgressRef.current = false;
              transitionInProgressRef.current = false;
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
              
              // Reset the transition flags
              safeSetTimeout(() => {
                flyInProgressRef.current = false;
                transitionInProgressRef.current = false;
                if (!isUnmountedRef.current) {
                  setHasInitialPositioning(true);
                }
              }, 300);
              
              if (!isUnmountedRef.current) {
                toast({
                  title: "Location Found",
                  description: `Navigated to ${selectedLocation.label || 'coordinates'}: ${newPosition[0].toFixed(6)}, ${newPosition[1].toFixed(6)}`,
                  duration: 3000,
                });
              }
            } catch (err) {
              console.error('Error adding location marker:', err);
              flyInProgressRef.current = false;
              transitionInProgressRef.current = false;
            }
          }, 500);
        }, 300);
      } catch (error) {
        console.error('Error flying to location in Leaflet:', error);
        flyInProgressRef.current = false;
        transitionInProgressRef.current = false;
        
        if (!isUnmountedRef.current) {
          toast({
            title: "Navigation Error",
            description: "Could not navigate to the selected location",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
    }
  }, [selectedLocation, map, isMapReady, hasInitialPositioning]);
}
