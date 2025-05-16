
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

// Define interface for internal map properties not exposed in TypeScript definitions
// Use type intersection instead of extends to avoid interface compatibility issues
interface LeafletMapInternal {
  _panes?: {
    mapPane?: {
      _leaflet_pos?: any;
    };
  };
  _isDestroyed?: boolean;
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
      
      // Call onMapReady sooner to start initialization process
      const timeout = setTimeout(() => {
        try {
          // Check if map container still exists and is attached to DOM
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            // Mark as called immediately to prevent duplicate calls
            hasCalledOnReady.current = true;
            
            // Always invalidate size immediately for better responsiveness
            try {
              map.invalidateSize(true);
              console.log('Initial size invalidation completed');
            } catch (err) {
              console.log('Initial invalidateSize encountered an issue, continuing');
            }
            
            console.log('Map container verified, calling onMapReady');
            onMapReady(map);
            
            // Mark map as stable after initial setup
            setTimeout(() => {
              setIsStable(true);
            }, 300); // Shorter delay for faster stabilization
            
            // Just one additional invalidation after a reasonable delay
            const additionalTimeout = setTimeout(() => {
              if (map && !(map as L.Map & LeafletMapInternal)._isDestroyed) {
                try {
                  map.invalidateSize(true);
                  console.log('Final map invalidation completed');
                } catch (err) {
                  // Ignore errors during additional invalidations
                }
              }
            }, 1000); // Faster final invalidation
            timeoutRefs.current.push(additionalTimeout);
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
            }, 500); // Faster retry
            timeoutRefs.current.push(retryTimeout);
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
          toast.error("Map initialization issue. Please refresh the page.");
        }
      }, 100); // Much faster initial call
      
      timeoutRefs.current.push(timeout);
    }
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
