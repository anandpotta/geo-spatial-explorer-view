
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
  _mapContainerId?: string;
  _leaflet_id?: number;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap() as LeafletMapInternal;
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
    if (!map) return;
    
    // Only call onMapReady once per instance and if not unmounting
    if (map && onMapReady && !hasCalledOnReady.current && !isUnmountingRef.current) {
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Immediately mark as called to prevent duplicate calls
      hasCalledOnReady.current = true;
      
      // Wait until the map is fully initialized before calling onMapReady
      const timeout = setTimeout(() => {
        if (isUnmountingRef.current) {
          console.log('Component unmounting, skipping map ready callback');
          return;
        }
        
        try {
          // Check if map still exists
          if (!map || map._leaflet_id === undefined) {
            console.log('Map no longer exists, skipping initialization');
            return;
          }
          
          // Check if map container still exists and is attached to DOM
          const container = map.getContainer();
          if (container && document.body.contains(container)) {
            // Try to invalidate size if map is properly initialized
            try {
              if (map && 
                  map._panes && 
                  map._panes.mapPane) {
                console.log('Map panes initialized, calling invalidateSize');
                map.invalidateSize(true);
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
              
              // One additional invalidation after a delay
              const additionalTimeout = setTimeout(() => {
                if (map && !isUnmountingRef.current && map._leaflet_id !== undefined) {
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
