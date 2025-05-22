
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
  const initialPositioningAttemptsRef = useRef(0);

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

  // Force map refresh after it becomes ready
  useEffect(() => {
    if (map && isMapReady) {
      safeSetTimeout(() => {
        if (!isUnmountedRef.current && map) {
          console.log("useLocationSync: Map is ready, forcing invalidateSize");
          map.invalidateSize(true);
          
          // If we have a location but haven't positioned the map yet, do it now
          if (selectedLocation && !hasInitialPositioning) {
            // We need to call processLocationChange, but it's defined in another effect
            // Instead, we'll call all the necessary logic here directly
            if (map && !isUnmountedRef.current) {
              try {
                console.log("useLocationSync: Forcing initial positioning");
                map.invalidateSize(true);
                map.setView([selectedLocation.y, selectedLocation.x], 14, { animate: false });
                setHasInitialPositioning(true);
              } catch (err) {
                console.error("Error in initial positioning:", err);
              }
            }
          }
        }
      }, 300);
    }
  }, [map, isMapReady, selectedLocation, hasInitialPositioning]);

  useEffect(() => {
    if (!selectedLocation || !map || !isMapReady) return;
    
    console.log(`useLocationSync: Syncing to location ${selectedLocation.label} at [${selectedLocation.y}, ${selectedLocation.x}]`);

    // Prevent operations during active transitions
    if (transitionInProgressRef.current) {
      console.log('useLocationSync: View transition in progress, skipping location update');
      return;
    }

    // Create a location identifier to track changes
    const locationId = `${selectedLocation.id}:${selectedLocation.y}:${selectedLocation.x}`;

    // Skip if it's the same location we're already at
    if (locationId === processedLocationRef.current && hasInitialPositioning) {
      console.log('useLocationSync: Skipping duplicate location selection', locationId);
      return;
    }

    // Skip if fly is already in progress
    if (flyInProgressRef.current) {
      console.log('useLocationSync: Fly already in progress, will try again later');
      
      // Queue the operation by setting a timeout
      const timer = safeSetTimeout(() => {
        if (locationId === processedLocationRef.current) {
          console.log('useLocationSync: Skipping deferred update - location already processed');
          return;
        }
        
        // Only process if component is still mounted
        if (!isUnmountedRef.current) {
          processLocationChange();
        }
      }, 1200);
      
      return;
    }

    // Multiple retry attempts for initial positioning
    if (!hasInitialPositioning) {
      initialPositioningAttemptsRef.current++;
      
      if (initialPositioningAttemptsRef.current > 3) {
        console.log(`useLocationSync: Multiple attempts (${initialPositioningAttemptsRef.current}) to position map, forcing approach`);
        // Force a delay and retry with basic approach if we're having trouble
        safeSetTimeout(() => {
          if (map && !isUnmountedRef.current) {
            try {
              console.log("useLocationSync: Forcing basic positioning approach");
              map.invalidateSize(true);
              map.setView([selectedLocation.y, selectedLocation.x], 14, { animate: false });
              setHasInitialPositioning(true);
            } catch (err) {
              console.error("Error in force positioning:", err);
            }
          }
        }, 800);
        return;
      }
    }

    // Define processLocationChange function inside the useEffect to access the variables in scope
    function processLocationChange() {
      if (isUnmountedRef.current || !map) return;
      
      // Set transition state
      transitionInProgressRef.current = true;
      
      // Update location reference and set fly in progress
      console.log(`useLocationSync: Flying to location ${selectedLocation.label} at [${selectedLocation.y}, ${selectedLocation.x}]`);
      processedLocationRef.current = locationId;
      flyInProgressRef.current = true;

      try {
        // Force map invalidation to ensure proper rendering
        safeSetTimeout(() => {
          if (!map || isUnmountedRef.current) return;
          
          console.log("useLocationSync: Invalidating map size");
          map.invalidateSize(true);
          
          // Position the map at the selected location
          const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
          
          // Use flyTo with animation for smoother experience
          map.flyTo(newPosition, 14, {
            animate: true,
            duration: 1.5,
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
                  description: `Navigated to ${selectedLocation.label || 'coordinates'}: ${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`,
                  duration: 3000,
                });
              }
            } catch (err) {
              console.error('Error adding location marker:', err);
              flyInProgressRef.current = false;
              transitionInProgressRef.current = false;
            }
          }, 500);
        }, 200);
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
    
    processLocationChange();
  }, [selectedLocation, map, isMapReady, hasInitialPositioning]);
}
