
import { useCallback } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

export const useMapReferenceHandler = (
  mapRef: React.MutableRefObject<L.Map | null>,
  isMapInitialized: boolean,
  cleanupInProgress: React.MutableRefObject<boolean>,
  setIsMapInitialized: (value: boolean) => void,
  mapInitializedSuccessfully: React.MutableRefObject<boolean>,
  mapReadyAttempts: number,
  setMapReadyAttempts: (value: number) => void,
  onMapReady?: (map: L.Map) => void
) => {
  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    // Skip setup if cleanup is in progress
    if (cleanupInProgress.current) {
      console.warn('Cleanup in progress, skipping map setup');
      return;
    }
    
    // Store map reference immediately
    mapRef.current = map;
    
    // First invalidation to ensure map is properly sized
    map.invalidateSize(true);
    
    // Start initialization sequence with longer delays
    setTimeout(() => {
      if (!mapRef.current || cleanupInProgress.current) return;
      
      try {
        // Check if map container is available in DOM
        if (!mapRef.current.getContainer() || !document.body.contains(mapRef.current.getContainer())) {
          console.warn('Map container not found or not in DOM');
          return;
        }
        
        // First invalidateSize to fix initial rendering
        mapRef.current.invalidateSize(true);
        
        // Second stage with longer timeout
        setTimeout(() => {
          if (!mapRef.current || cleanupInProgress.current) return;
          
          try {
            if (!mapRef.current.getContainer() || !document.body.contains(mapRef.current.getContainer())) {
              console.warn('Map container disappeared during initialization');
              return;
            }
            
            // Second invalidateSize to ensure map is properly rendered
            mapRef.current.invalidateSize(true);
            
            // Final stage with longest timeout to ensure complete rendering
            setTimeout(() => {
              if (!mapRef.current || cleanupInProgress.current) return;
              
              try {
                if (!mapRef.current.getContainer() || !document.body.contains(mapRef.current.getContainer())) {
                  console.warn('Map container disappeared during final initialization');
                  return;
                }
                
                // Check for map pane as indicator of map readiness
                const mapPane = mapRef.current.getContainer().querySelector('.leaflet-map-pane');
                if (!mapPane) {
                  console.warn('Map pane not found, map may not be ready');
                  
                  // Try again if we haven't exceeded max attempts
                  if (mapReadyAttempts < 5) {
                    setMapReadyAttempts(mapReadyAttempts + 1); // Fixed: direct value instead of function
                    return;
                  }
                }
                
                // Final invalidateSize to ensure map is fully ready
                mapRef.current.invalidateSize(true);
                
                // Mark as initialized after all checks pass
                setTimeout(() => {
                  if (!mapRef.current || cleanupInProgress.current) return;
                  
                  // Set flag for successful initialization
                  setIsMapInitialized(true);
                  mapInitializedSuccessfully.current = true;
                  
                  console.log('Map successfully initialized');
                  
                  // Call the onMapReady callback if provided
                  if (onMapReady && mapRef.current) {
                    onMapReady(mapRef.current);
                  }
                }, 150); // Slightly longer delay for final initialization
              } catch (err) {
                console.error('Error during final map initialization:', err);
                
                if (mapReadyAttempts < 5) {
                  setMapReadyAttempts(mapReadyAttempts + 1); // Fixed: direct value instead of function
                }
              }
            }, 500); // Increased from 300ms to 500ms
          } catch (err) {
            console.error('Error in second initialization step:', err);
            
            if (mapReadyAttempts < 5) {
              setMapReadyAttempts(mapReadyAttempts + 1); // Fixed: direct value instead of function
            }
          }
        }, 500); // Increased from 300ms to 500ms
      } catch (err) {
        console.error('Error in map initialization:', err);
      }
    }, 500); // Increased from 300ms to 500ms
  }, [
    mapRef,
    cleanupInProgress,
    setIsMapInitialized,
    mapInitializedSuccessfully,
    mapReadyAttempts,
    setMapReadyAttempts,
    onMapReady
  ]);

  return handleSetMapRef;
};
