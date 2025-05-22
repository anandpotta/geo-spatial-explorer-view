
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { isMapValid, safeInvalidateSize, forceMapTileRefresh } from '@/utils/leaflet-type-utils';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal {
  _panes?: {
    mapPane?: {
      _leaflet_pos?: any;
    };
  };
  _isDestroyed?: boolean;
  _size?: L.Point;
  _onResize?: () => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [isStable, setIsStable] = useState(false);
  const mapInitializedRef = useRef(false);
  const mapValidityCheckCountRef = useRef(0);
  const maxValidityChecks = 10;
  const tileRefreshAttemptsRef = useRef(0);
  
  // Clear all timeouts when unmounting
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
      mapInitializedRef.current = false;
      hasCalledOnReady.current = false;
    };
  }, []);
  
  // Listen for custom refresh events
  useEffect(() => {
    const refreshTiles = () => {
      if (!map) return;
      
      try {
        console.log('MapReference: Handling refresh-needed event');
        tileRefreshAttemptsRef.current++;
        
        // Ensure _leaflet_pos exists
        try {
          const mapPane = map.getPane('mapPane');
          if (mapPane && !(mapPane as any)._leaflet_pos) {
            (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
          }
        } catch (e) {
          console.warn('Error setting _leaflet_pos:', e);
        }
        
        // First try to invalidate the map size
        safeInvalidateSize(map);
        
        // Then force a more aggressive tile refresh
        forceMapTileRefresh(map);
      } catch (e) {
        console.warn('Error handling refresh event:', e);
      }
    };
    
    document.addEventListener('leaflet-refresh-needed', refreshTiles);
    
    return () => {
      document.removeEventListener('leaflet-refresh-needed', refreshTiles);
    };
  }, [map]);
  
  // Function to check if map is valid and ready
  const checkMapValidity = () => {
    if (!map) return false;
    
    try {
      // Basic validity check
      const valid = isMapValid(map);
      
      if (valid) {
        // Extra check and fix for _leaflet_pos
        const mapPane = map.getPane('mapPane');
        if (mapPane && !(mapPane as any)._leaflet_pos) {
          (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
        }
        
        // Check internal panes structure too
        const internalMap = map as L.Map & LeafletMapInternal;
        if (internalMap._panes && internalMap._panes.mapPane && !internalMap._panes.mapPane._leaflet_pos) {
          internalMap._panes.mapPane._leaflet_pos = { x: 0, y: 0 };
        }
        
        // Ensure _size exists
        if (!(internalMap as any)._size) {
          (internalMap as any)._size = new L.Point(0, 0);
        }
      }
      
      return valid;
    } catch (err) {
      console.warn('Error checking map validity:', err);
      return false;
    }
  };
  
  useEffect(() => {
    // Skip if no map, already initialized, or already called onMapReady
    if (!map || mapInitializedRef.current || hasCalledOnReady.current) {
      return;
    }
    
    mapInitializedRef.current = true;
    console.log('MapReference: Started initialization process');
    
    const initializeMap = () => {
      // Always invalidate size immediately
      try {
        safeInvalidateSize(map);
        console.log('Initial size invalidation completed');
      } catch (err) {
        console.log('Initial invalidateSize encountered an issue, continuing');
      }
      
      // Check map validity repeatedly until it's valid or max checks reached
      const checkMapAndNotify = () => {
        if (mapValidityCheckCountRef.current >= maxValidityChecks) {
          console.warn('Max map validity checks reached, proceeding anyway');
          completeInitialization();
          return;
        }
        
        mapValidityCheckCountRef.current++;
        console.log(`Map validity check ${mapValidityCheckCountRef.current}/${maxValidityChecks}`);
        
        if (checkMapValidity()) {
          console.log('Map is valid, completing initialization');
          completeInitialization();
        } else {
          console.log('Map not valid yet, retrying after delay');
          const retryTimeout = setTimeout(checkMapAndNotify, 300);
          timeoutRefs.current.push(retryTimeout);
        }
      };
      
      const completeInitialization = () => {
        if (hasCalledOnReady.current) return;
        
        try {
          // Final invalidateSize for good measure
          safeInvalidateSize(map);
          
          // Check if map pane is missing _leaflet_pos and fix it
          const mapPane = map.getPane('mapPane');
          if (mapPane && !(mapPane as any)._leaflet_pos) {
            (mapPane as any)._leaflet_pos = new L.Point(0, 0);
          }
          
          // Also check internal panes structure
          const internalMap = map as L.Map & LeafletMapInternal;
          if (internalMap._panes && internalMap._panes.mapPane && !internalMap._panes.mapPane._leaflet_pos) {
            internalMap._panes.mapPane._leaflet_pos = new L.Point(0, 0);
          }
          
          console.log('Map container verified, calling onMapReady');
          hasCalledOnReady.current = true;
          onMapReady(map);
          
          // Mark map as stable after initial setup
          setTimeout(() => {
            setIsStable(true);
          }, 300);
          
          // Schedule multiple tile refreshes to ensure visibility
          const refreshTimes = [100, 300, 600, 1000, 2000, 3000]; // ms
          refreshTimes.forEach(delay => {
            const refreshTimeout = setTimeout(() => {
              if (map && !(map as L.Map & LeafletMapInternal)._isDestroyed) {
                safeInvalidateSize(map);
                forceMapTileRefresh(map);
                
                // Also fire events that might trigger tile loading
                try {
                  map.fire('moveend');
                  map.fire('zoomend');
                } catch (e) {
                  console.warn('Error firing map events:', e);
                }
                
                console.log(`Map invalidation and tile refresh at ${delay}ms`);
              }
            }, delay);
            timeoutRefs.current.push(refreshTimeout);
          });
        } catch (err) {
          console.error('Error during map initialization:', err);
          toast.error("Map initialization issue. Please refresh the page.");
        }
      };
      
      // Start the validity check process
      checkMapAndNotify();
    };
    
    // Start the initialization process after a short delay
    const initTimeout = setTimeout(initializeMap, 50);
    timeoutRefs.current.push(initTimeout);
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
