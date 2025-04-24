
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  useEffect(() => {
    // Check if the map is initialized
    const checkMapIsReady = () => {
      try {
        if (map && map.getContainer() && map._loaded) {
          console.log('Map is confirmed ready with container and loaded status');
          return true;
        }
      } catch (err) {
        console.log('Map not yet ready:', err);
      }
      return false;
    };
    
    // Only proceed if map exists and callback hasn't been called
    if (map && onMapReady && !hasCalledOnReady.current) {
      // First, invalidate size and let the map update with a delay
      setTimeout(() => {
        try {
          if (map && map.getContainer()) {
            map.invalidateSize(true);
            setIsMapReady(true);
          }
        } catch (err) {
          console.error('Error during initial map invalidation:', err);
        }
      }, 500);
    }
  }, [map]);
  
  // Separate effect for calling onMapReady only after map is confirmed ready
  useEffect(() => {
    if (!isMapReady || hasCalledOnReady.current || !map) return;
    
    // Map is now ready, call onMapReady with a delay to ensure DOM is updated
    const timer = setTimeout(() => {
      try {
        if (map && map.getContainer() && map._loaded) {
          console.log('Map is ready, calling onMapReady');
          hasCalledOnReady.current = true;
          onMapReady(map);
        } else {
          console.log('Map not fully initialized yet, will retry');
          setIsMapReady(false); // Reset to trigger another attempt
        }
      } catch (error) {
        console.error('Error when calling onMapReady:', error);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [map, onMapReady, isMapReady]);
  
  // Clean up function
  useEffect(() => {
    return () => {
      hasCalledOnReady.current = false;
    };
  }, []);
  
  return null;
};

export default MapReference;
