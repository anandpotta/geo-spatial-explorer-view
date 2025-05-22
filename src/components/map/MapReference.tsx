
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';

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
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [isStable, setIsStable] = useState(false);
  const mapInitializedRef = useRef(false);
  const mapValidityCheckCountRef = useRef(0);
  const maxValidityChecks = 10;
  
  // Clear all timeouts when unmounting
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
      mapInitializedRef.current = false;
      hasCalledOnReady.current = false;
    };
  }, []);
  
  // Function to check if map is valid and ready
  const checkMapValidity = () => {
    if (!map) return false;
    
    try {
      // Check if map instance exists and has required methods
      if (typeof map.getContainer !== 'function') return false;
      
      // Check if the container element exists in the DOM
      const container = map.getContainer();
      if (!container || !document.body.contains(container)) {
        return false;
      }
      
      // Check if map pane exists and has position
      const mapPane = map.getPane('mapPane');
      if (!mapPane || !(mapPane as any)._leaflet_pos) {
        return false;
      }
      
      // For maximum safety, check that map has core Leaflet methods
      return typeof map.setView === 'function' && 
             typeof map.addLayer === 'function' && 
             typeof map.getZoom === 'function';
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
        map.invalidateSize(true);
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
          map.invalidateSize(true);
          
          console.log('Map container verified, calling onMapReady');
          hasCalledOnReady.current = true;
          onMapReady(map);
          
          // Mark map as stable after initial setup
          setTimeout(() => {
            setIsStable(true);
          }, 300);
          
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
          }, 1000);
          timeoutRefs.current.push(additionalTimeout);
        } catch (err) {
          console.error('Error during map initialization:', err);
          toast.error("Map initialization issue. Please refresh the page.");
        }
      };
      
      // Start the validity check process
      checkMapAndNotify();
    };
    
    // Start the initialization process after a short delay
    const initTimeout = setTimeout(initializeMap, 100);
    timeoutRefs.current.push(initTimeout);
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
