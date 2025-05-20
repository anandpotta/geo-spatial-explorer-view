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

// Keep track of map instances globally
declare global {
  interface Window {
    _leafletMapInstances?: L.Map[];
  }
}

// Initialize the global tracking array if it doesn't exist
if (typeof window !== 'undefined' && !window._leafletMapInstances) {
  window._leafletMapInstances = [];
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [isStable, setIsStable] = useState(false);
  const mapInstanceId = useRef(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Clear all timeouts when unmounting
  useEffect(() => {
    // Add this map instance to our global tracking
    if (typeof window !== 'undefined' && map) {
      // Give the map a unique identifier for debugging
      (map as any)._instanceId = mapInstanceId.current;
      console.log(`Registering map instance: ${mapInstanceId.current}`);
      
      if (!window._leafletMapInstances) {
        window._leafletMapInstances = [];
      }
      window._leafletMapInstances.push(map);
    }

    return () => {
      // Clear timeouts
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];

      // Remove this instance from global tracking
      if (typeof window !== 'undefined' && window._leafletMapInstances) {
        console.log(`Removing map instance: ${mapInstanceId.current}`);
        window._leafletMapInstances = window._leafletMapInstances.filter(
          m => (m as any)._instanceId !== mapInstanceId.current
        );
      }
      
      // Help GC by removing references
      hasCalledOnReady.current = false;
    };
  }, [map]);
  
  useEffect(() => {
    // Only call onMapReady once per instance
    if (map && onMapReady && !hasCalledOnReady.current) {
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Wait until the map is fully initialized before calling onMapReady
      const timeout = setTimeout(() => {
        try {
          // Check if map container still exists and is attached to DOM
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            // Mark as called immediately to prevent duplicate calls
            hasCalledOnReady.current = true;
            
            // Check if map is valid before trying to invalidate size
            try {
              // Force a size recalculation
              map.invalidateSize(true);
            } catch (err) {
              console.log('Skipping invalidateSize due to initialization state');
            }
            
            console.log('Map container verified, calling onMapReady');
            onMapReady(map);
            
            // Mark map as stable after initial setup
            setTimeout(() => {
              setIsStable(true);
            }, 500);
          } else {
            console.log('Map container not ready or not attached to DOM');
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
          toast.error("Map initialization issue. Please refresh the page.");
        }
      }, 250);
      
      timeoutRefs.current.push(timeout);
    }
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
