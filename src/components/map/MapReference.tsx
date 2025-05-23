
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
  const isUnmountingRef = useRef(false);
  
  // Clear all timeouts when unmounting
  useEffect(() => {
    isUnmountingRef.current = false;
    
    return () => {
      isUnmountingRef.current = true;
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);
  
  useEffect(() => {
    // Only call onMapReady once per instance and if not unmounting
    if (map && onMapReady && !hasCalledOnReady.current && !isUnmountingRef.current) {
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Wait until the map is fully initialized before calling onMapReady
      const timeout = setTimeout(() => {
        if (isUnmountingRef.current) {
          console.log('Component unmounting, skipping map ready callback');
          return;
        }
        
        try {
          // Check if map container still exists and is attached to DOM
          const container = map.getContainer();
          if (map && container && document.body.contains(container)) {
            // Mark as called immediately to prevent duplicate calls
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
            if (!isUnmountingRef.current) {
              setTimeout(() => {
                if (!isUnmountingRef.current) {
                  setIsStable(true);
                }
              }, 500);
              
              // Just one additional invalidation after a reasonable delay
              const additionalTimeout = setTimeout(() => {
                if (map && !isUnmountingRef.current && !map.remove['_leaflet_id']) {
                  try {
                    map.invalidateSize(true);
                    console.log('Final map invalidation completed');
                  } catch (err) {
                    // Ignore errors during additional invalidations
                  }
                }
              }, 1500);
              timeoutRefs.current.push(additionalTimeout);
            }
          } else {
            console.log('Map container not ready or not attached to DOM');
            // Retry in case the map container wasn't ready yet
            if (!isUnmountingRef.current) {
              const retryTimeout = setTimeout(() => {
                if (map && !hasCalledOnReady.current && !isUnmountingRef.current) {
                  try {
                    const retryContainer = map.getContainer();
                    if (retryContainer && document.body.contains(retryContainer)) {
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
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
          if (!isUnmountingRef.current) {
            toast.error("Map initialization issue. Please refresh the page.");
          }
        }
      }, 250);
      
      timeoutRefs.current.push(timeout);
    }
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
