
// Import the extended Leaflet types
import { useCallback } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import '../types/leaflet-extended'; // Import our extended types

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
    
    // Don't proceed if we already initialized this map instance
    if (map._panes && mapInitializedSuccessfully.current) {
      console.log('Map already initialized, skipping duplicate initialization');
      return;
    }
    
    // First invalidation to ensure map is properly sized
    map.invalidateSize(true);
    
    // Use a more reliable approach to checking if the map container is valid
    const checkMapContainer = () => {
      if (!mapRef.current) return false;
      
      try {
        const container = mapRef.current.getContainer();
        
        // More thorough container validation
        const isValid = container && 
                       document.body.contains(container) && 
                       container.clientWidth > 0 && 
                       container.clientHeight > 0 &&
                       window.getComputedStyle(container).display !== 'none' &&
                       window.getComputedStyle(container).visibility !== 'hidden';
        
        if (!isValid) {
          console.log('Map container validation failed:', {
            exists: !!container,
            inDOM: container ? document.body.contains(container) : false,
            width: container ? container.clientWidth : 0,
            height: container ? container.clientHeight : 0,
            display: container ? window.getComputedStyle(container).display : 'unknown',
            visibility: container ? window.getComputedStyle(container).visibility : 'unknown'
          });
        }
        
        return isValid;
      } catch (err) {
        console.error('Error checking map container:', err);
        return false;
      }
    };
    
    // Use requestAnimationFrame for smoother initialization sequence
    requestAnimationFrame(() => {
      if (!mapRef.current || cleanupInProgress.current) return;
      
      try {
        // Check if map container is available in DOM
        if (!checkMapContainer()) {
          console.log('Map container not found or not visible, retrying...');
          
          // Try again if we haven't exceeded max attempts
          if (mapReadyAttempts < 5) {
            setMapReadyAttempts(mapReadyAttempts + 1);
          }
          return;
        }
        
        // First invalidateSize to fix initial rendering
        mapRef.current.invalidateSize(true);
        
        // Second stage with improved timing
        setTimeout(() => {
          if (!mapRef.current || cleanupInProgress.current) return;
          
          try {
            if (!checkMapContainer()) {
              console.log('Map container validation failed during second phase');
              
              // Try again if we haven't exceeded max attempts
              if (mapReadyAttempts < 5) {
                setMapReadyAttempts(mapReadyAttempts + 1);
              }
              return;
            }
            
            // Apply multiple invalidateSize calls with spacing
            mapRef.current.invalidateSize(true);
            
            // Force pane creation if not already created
            if (mapRef.current && !mapRef.current._panes) {
              console.log('Forcing pane creation');
              mapRef.current._initPathRoot && mapRef.current._initPathRoot();
            }
            
            // Final stage with progressive validation
            setTimeout(() => {
              if (!mapRef.current || cleanupInProgress.current) return;
              
              try {
                if (!checkMapContainer()) {
                  console.warn('Map container disappeared during final initialization');
                  
                  if (mapReadyAttempts < 5) {
                    console.log(`Retrying initialization (attempt ${mapReadyAttempts + 1} of 5)`);
                    setMapReadyAttempts(mapReadyAttempts + 1);
                    return;
                  } else {
                    console.warn('Maximum initialization attempts reached');
                  }
                  return;
                }
                
                // Apply final invalidateSize
                mapRef.current.invalidateSize(true);
                
                // Check for map readiness by verifying essential elements
                const isMapReady = () => {
                  if (!mapRef.current) return false;
                  
                  try {
                    const container = mapRef.current.getContainer();
                    if (!container || !document.body.contains(container)) return false;
                    
                    // Check for essential map elements
                    const tilePane = container.querySelector('.leaflet-tile-pane');
                    const mapPane = container.querySelector('.leaflet-map-pane');
                    const tileLayer = mapRef.current._layers ? 
                      Object.values(mapRef.current._layers).some(layer => (layer as any)._url) : 
                      false;
                    
                    return !!tilePane && !!mapPane && !!tileLayer;
                  } catch (err) {
                    console.error('Error checking map readiness:', err);
                    return false;
                  }
                };
                
                // Final initialization with readiness check
                if (isMapReady()) {
                  // Lock initialization to prevent duplicates
                  setIsMapInitialized(true);
                  mapInitializedSuccessfully.current = true;
                  
                  console.log('Map successfully initialized');
                  
                  // Call the onMapReady callback if provided
                  if (onMapReady && mapRef.current) {
                    onMapReady(mapRef.current);
                  }
                } else {
                  console.log('Map not fully ready yet, applying final preparations');
                  
                  // One more attempt with increased delay
                  setTimeout(() => {
                    if (!mapRef.current || cleanupInProgress.current) return;
                    
                    if (checkMapContainer()) {
                      mapRef.current.invalidateSize(true);
                      
                      // Set flag for successful initialization
                      setIsMapInitialized(true);
                      mapInitializedSuccessfully.current = true;
                      
                      console.log('Map initialization completed with extra delay');
                      
                      // Call the onMapReady callback if provided
                      if (onMapReady && mapRef.current) {
                        onMapReady(mapRef.current);
                      }
                    }
                  }, 300);
                }
              } catch (err) {
                console.error('Error during final map initialization:', err);
                
                if (mapReadyAttempts < 5) {
                  setMapReadyAttempts(mapReadyAttempts + 1);
                }
              }
            }, 500);
          } catch (err) {
            console.error('Error in second initialization step:', err);
            
            if (mapReadyAttempts < 5) {
              setMapReadyAttempts(mapReadyAttempts + 1);
            }
          }
        }, 500);
      } catch (err) {
        console.error('Error in map initialization:', err);
      }
    });
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
