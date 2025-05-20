
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
  mapKey?: string;
}

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _panes?: {
    mapPane?: {
      _leaflet_pos?: any;
    };
  };
}

const MapReference = ({ onMapReady, mapKey = 'default' }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [isStable, setIsStable] = useState(false);
  
  // Clear all timeouts when unmounting
  useEffect(() => {
    // Set data attribute for identification
    try {
      if (map && map.getContainer) {
        const container = map.getContainer();
        if (container) {
          container.setAttribute('data-map-key', mapKey);
        }
      }
    } catch (err) {
      console.warn('Could not set map key on container:', err);
    }
    
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
      
      // Clean up map-specific markers on unmount
      try {
        document.querySelectorAll(`[data-map-key="${mapKey}"]`).forEach(el => {
          if (el.classList.contains('leaflet-marker-icon') || 
              el.classList.contains('leaflet-marker-shadow')) {
            el.remove();
          }
        });
      } catch (err) {
        console.warn('Error cleaning up map markers:', err);
      }
    };
  }, [mapKey]);
  
  useEffect(() => {
    // Only call onMapReady once per instance
    if (map && onMapReady && !hasCalledOnReady.current) {
      console.log(`Map ${mapKey} is ready, will call onMapReady after initialization`);
      
      // Wait until the map is fully initialized before calling onMapReady
      const timeout = setTimeout(() => {
        try {
          // Map error handling - check if map container is valid
          if (!map || !map.getContainer || !map.getContainer()) {
            console.error(`Map ${mapKey} or container is invalid`);
            // Dispatch error event for parent components to handle
            window.dispatchEvent(new Event('mapError'));
            return;
          }
          
          // Before calling onMapReady, make sure no other map is using this container
          const container = map.getContainer();
          const mapId = container.id;
          
          // Check if any other map instances are using this container
          const existingMaps = document.querySelectorAll(`[data-map-key]:not([data-map-key="${mapKey}"])`);
          for (const elem of existingMaps) {
            if (elem.id === mapId) {
              console.error(`Map container ${mapId} is being reused by another instance with key ${elem.getAttribute('data-map-key')}`);
              window.dispatchEvent(new Event('mapError'));
              return;
            }
          }
          
          // Check if map container still exists and is attached to DOM
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
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
                console.log(`Map ${mapKey} panes initialized, calling invalidateSize`);
                map.invalidateSize(true);
              } else {
                console.log(`Map ${mapKey} panes not fully initialized yet, skipping invalidateSize`);
              }
            } catch (err) {
              console.log(`Skipping invalidateSize due to initialization state for map ${mapKey}`);
            }
            
            console.log(`Map ${mapKey} container verified, calling onMapReady`);
            onMapReady(map);
            
            // Mark map as stable after initial setup
            setTimeout(() => {
              setIsStable(true);
            }, 500);
            
            // Just one additional invalidation after a reasonable delay
            const additionalTimeout = setTimeout(() => {
              if (map && !map.remove['_leaflet_id']) {
                try {
                  map.invalidateSize(true);
                  console.log(`Final map ${mapKey} invalidation completed`);
                } catch (err) {
                  // Ignore errors during additional invalidations
                }
              }
            }, 1500);
            timeoutRefs.current.push(additionalTimeout);
          } else {
            console.log(`Map ${mapKey} container not ready or not attached to DOM`);
            // Retry in case the map container wasn't ready yet
            const retryTimeout = setTimeout(() => {
              if (map && !hasCalledOnReady.current) {
                try {
                  if (map.getContainer() && document.body.contains(map.getContainer())) {
                    hasCalledOnReady.current = true;
                    onMapReady(map);
                    map.invalidateSize(true);
                  } else {
                    // Map container still not valid after retry
                    window.dispatchEvent(new Event('mapError'));
                  }
                } catch (e) {
                  console.warn(`Failed to initialize map ${mapKey} on retry:`, e);
                  window.dispatchEvent(new Event('mapError'));
                }
              }
            }, 1000);
            timeoutRefs.current.push(retryTimeout);
          }
        } catch (err) {
          console.error(`Error in map ${mapKey} initialization:`, err);
          toast.error("Map initialization issue. Please refresh the page.");
          window.dispatchEvent(new Event('mapError'));
        }
      }, 250);
      
      timeoutRefs.current.push(timeout);
    }
  }, [map, onMapReady, mapKey]);
  
  return null;
};

export default MapReference;
