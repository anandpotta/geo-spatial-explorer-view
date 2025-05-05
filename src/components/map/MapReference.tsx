
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _panes?: {
    mapPane?: {
      _leaflet_pos?: any;
    };
  };
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [isStable, setIsStable] = useState(false);
  
  // Clear all timeouts when unmounting
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);
  
  useEffect(() => {
    // Only call onMapReady once per instance
    if (map && onMapReady && !hasCalledOnReady.current) {
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Wait until the map is fully initialized before calling onMapReady
      const timeout = setTimeout(() => {
        try {
          // Check if map container still exists and is attached to DOM
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            hasCalledOnReady.current = true;
            
            // Check if map is valid before trying to invalidate size
            try {
              // Cast to internal map type to access private properties
              const internalMap = map as LeafletMapInternal;
              
              // Only invalidate size if map is properly initialized
              if (internalMap && 
                  internalMap._panes && 
                  internalMap._panes.mapPane) {
                console.log('Map panes initialized, calling invalidateSize');
                map.invalidateSize(true);
              } else {
                console.log('Map panes not fully initialized yet, skipping invalidateSize');
              }
            } catch (err) {
              console.log('Skipping invalidateSize due to initialization state');
            }
            
            console.log('Map container verified, calling onMapReady');
            onMapReady(map);
            
            // Mark map as stable after initial setup
            setTimeout(() => {
              setIsStable(true);
            }, 500);
            
            // Additional size invalidations after different timeouts
            const additionalTimings = [500, 1500, 3000];
            additionalTimings.forEach(timing => {
              const additionalTimeout = setTimeout(() => {
                if (map && !map.remove['_leaflet_id']) {
                  try {
                    map.invalidateSize(true);
                    // After the final invalidate, ensure map is marked ready
                    if (timing === additionalTimings[additionalTimings.length - 1]) {
                      // Force another validity check
                      if (map.getContainer() && document.body.contains(map.getContainer())) {
                        console.log('Final map validation complete');
                      }
                    }
                  } catch (err) {
                    // Ignore errors during additional invalidations
                  }
                }
              }, timing);
              timeoutRefs.current.push(additionalTimeout);
            });
          } else {
            console.log('Map container not ready or not attached to DOM');
            // Retry in case the map container wasn't ready yet
            const retryTimeout = setTimeout(() => {
              if (map && !hasCalledOnReady.current) {
                try {
                  if (map.getContainer() && document.body.contains(map.getContainer())) {
                    hasCalledOnReady.current = true;
                    onMapReady(map);
                    map.invalidateSize(true);
                  }
                } catch (e) {
                  console.warn('Failed to initialize map on retry');
                }
              }
            }, 1000);
            timeoutRefs.current.push(retryTimeout);
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
          toast.error("Map initialization issue. Please refresh the page.");
        }
      }, 250);
      
      timeoutRefs.current.push(timeout);
    }
    
    // Clean up function
    return () => {
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
