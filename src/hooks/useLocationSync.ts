
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
  const maxInitializationAttempts = 5; // Maximum number of attempts to initialize the map

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

  // Define processLocationChange function with improved error handling and retry logic
  function processLocationChange(map: L.Map, locationId: string, location: Location) {
    if (isUnmountedRef.current || !map) return;
    
    // Log detailed information for better debugging
    console.log(`useLocationSync: Starting location change to ${location.label} [${location.y}, ${location.x}]`);
    
    // Set transition state
    transitionInProgressRef.current = true;
    
    // Update location reference and set fly in progress
    processedLocationRef.current = locationId;
    flyInProgressRef.current = true;

    try {
      // Force map invalidation to ensure proper rendering
      safeSetTimeout(() => {
        if (!map || isUnmountedRef.current) return;
        
        console.log("useLocationSync: Invalidating map size before positioning");
        map.invalidateSize(true);
        
        // Position the map at the selected location
        const newPosition: [number, number] = [location.y, location.x];
        
        // Use flyTo with animation for smoother experience
        console.log(`useLocationSync: Flying to [${newPosition[0]}, ${newPosition[1]}]`);
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
            console.log("useLocationSync: Adding marker at location");
            // Clear existing markers to prevent cluttering
            map.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                map.removeLayer(layer);
              }
            });

            // Add a new marker at the precise location
            const marker = L.marker(newPosition).addTo(map);
            marker.bindPopup(
              `<b>${location.label || 'Selected Location'}</b><br>` +
              `${location.y.toFixed(6)}, ${location.x.toFixed(6)}`
            ).openPopup();
            
            // Reset the transition flags
            safeSetTimeout(() => {
              flyInProgressRef.current = false;
              transitionInProgressRef.current = false;
              if (!isUnmountedRef.current) {
                setHasInitialPositioning(true);
                console.log("useLocationSync: Initial positioning complete");
              }
            }, 300);
            
            if (!isUnmountedRef.current) {
              toast({
                title: "Location Found",
                description: `Navigated to ${location.label || 'coordinates'}: ${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`,
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

  // Force map refresh after it becomes ready
  useEffect(() => {
    if (map && isMapReady) {
      safeSetTimeout(() => {
        if (!isUnmountedRef.current && map) {
          console.log("useLocationSync: Map is ready, forcing invalidateSize");
          map.invalidateSize(true);
          
          // If we have a location but haven't positioned the map yet, do it now
          if (selectedLocation && !hasInitialPositioning) {
            try {
              console.log("useLocationSync: Forcing initial positioning");
              map.invalidateSize(true);
              map.setView([selectedLocation.y, selectedLocation.x], 14, { animate: false });
              setHasInitialPositioning(true);
            } catch (err) {
              console.error("Error in initial positioning:", err);
              
              // If initial positioning fails, we'll retry with a slight delay
              if (initialPositioningAttemptsRef.current < maxInitializationAttempts) {
                initialPositioningAttemptsRef.current++;
                safeSetTimeout(() => {
                  if (map && selectedLocation && !isUnmountedRef.current) {
                    try {
                      console.log(`useLocationSync: Retry ${initialPositioningAttemptsRef.current} for initial positioning`);
                      map.invalidateSize(true);
                      map.setView([selectedLocation.y, selectedLocation.x], 14, { animate: false });
                      setHasInitialPositioning(true);
                    } catch (innerErr) {
                      console.error(`Error in retry ${initialPositioningAttemptsRef.current}:`, innerErr);
                    }
                  }
                }, 500);
              }
            }
          }
        }
      }, 300);
    }
  }, [map, isMapReady, selectedLocation, hasInitialPositioning]);

  // Handle location changes with improved logic
  useEffect(() => {
    if (!selectedLocation || !map) return;
    
    console.log(`useLocationSync: Syncing to location ${selectedLocation.label} [${selectedLocation.y}, ${selectedLocation.x}]`);

    // Create a location identifier to track changes
    const locationId = `${selectedLocation.id}:${selectedLocation.y}:${selectedLocation.x}`;

    // Skip if it's the same location we're already at
    if (locationId === processedLocationRef.current && hasInitialPositioning) {
      console.log('useLocationSync: Skipping duplicate location selection', locationId);
      return;
    }

    // If map is ready, proceed with location change
    if (isMapReady) {
      console.log('useLocationSync: Map is ready, processing location change');
      processLocationChange(map, locationId, selectedLocation);
    } else {
      // If map is not ready yet, set a retry timer
      console.log('useLocationSync: Map not ready, setting retry timer');
      safeSetTimeout(() => {
        if (map && !isUnmountedRef.current) {
          console.log('useLocationSync: Retrying after delay');
          // Try to ensure map is properly initialized
          map.invalidateSize(true);
          processLocationChange(map, locationId, selectedLocation);
        }
      }, 800);
    }
  }, [selectedLocation, map, isMapReady, hasInitialPositioning]);
  
  // Listen for global reset events
  useEffect(() => {
    const handleReset = () => {
      console.log('useLocationSync: Reset event received');
      processedLocationRef.current = null;
      flyInProgressRef.current = false;
      transitionInProgressRef.current = false;
      setHasInitialPositioning(false);
      initialPositioningAttemptsRef.current = 0;
    };
    
    window.addEventListener('mapViewChange', handleReset);
    
    return () => {
      window.removeEventListener('mapViewChange', handleReset);
    };
  }, []);

  return { hasInitialPositioning };
}
