
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
    
    if (cleanupInProgress.current) {
      console.warn('Cleanup in progress, skipping map setup');
      return;
    }
    
    mapRef.current = map;
    
    setTimeout(() => {
      if (!mapRef.current || cleanupInProgress.current) return;
      
      try {
        if (!mapRef.current.getContainer() || !document.contains(mapRef.current.getContainer())) {
          console.warn('Map container not found or not in DOM');
          return;
        }
        
        mapRef.current.invalidateSize(true);
        
        setTimeout(() => {
          if (!mapRef.current || cleanupInProgress.current) return;
          
          try {
            if (!mapRef.current.getContainer() || !document.contains(mapRef.current.getContainer())) {
              console.warn('Map container disappeared during initialization');
              return;
            }
            
            mapRef.current.invalidateSize(true);
            
            setTimeout(() => {
              if (!mapRef.current || cleanupInProgress.current) return;
              
              try {
                if (!mapRef.current.getContainer() || !document.contains(mapRef.current.getContainer())) {
                  console.warn('Map container disappeared during final initialization');
                  return;
                }
                
                const mapPane = mapRef.current.getContainer().querySelector('.leaflet-map-pane');
                if (!mapPane) {
                  console.warn('Map pane not found, map may not be ready');
                  
                  if (mapReadyAttempts < 5) {
                    setMapReadyAttempts(prev => prev + 1);
                    return;
                  }
                }
                
                mapRef.current.invalidateSize(true);
                
                setTimeout(() => {
                  if (!mapRef.current || cleanupInProgress.current) return;
                  
                  setIsMapInitialized(true);
                  mapInitializedSuccessfully.current = true;
                  
                  console.log('Map successfully initialized');
                  
                  if (onMapReady && mapRef.current) {
                    onMapReady(mapRef.current);
                  }
                }, 100);
              } catch (err) {
                console.error('Error during final map initialization:', err);
                
                if (mapReadyAttempts < 5) {
                  setMapReadyAttempts(prev => prev + 1);
                }
              }
            }, 300);
          } catch (err) {
            console.error('Error in second initialization step:', err);
            
            if (mapReadyAttempts < 5) {
              setMapReadyAttempts(prev => prev + 1);
            }
          }
        }, 300);
      } catch (err) {
        console.error('Error in map initialization:', err);
      }
    }, 300);
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

