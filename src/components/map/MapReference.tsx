
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

// Use a type assertion interface for accessing Leaflet's internal properties
interface LeafletMapWithInternals extends L.Map {
  _mapPane?: {
    _leaflet_pos?: { x: number; y: number };
  };
  _container?: HTMLElement;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap() as LeafletMapWithInternals;
  const hasCalledOnReady = useRef(false);
  
  // Check if container still has a map instance
  const isMapContainerReused = () => {
    try {
      if (!map || !map._container) return false;
      
      // Check if this container already has a Leaflet instance
      return map._container.classList.contains('leaflet-container-reused');
    } catch (err) {
      console.error('Error checking map container reuse:', err);
      return false;
    }
  };
  
  useEffect(() => {
    // Only initialize if the map hasn't been initialized and container is available
    if (map && onMapReady && !hasCalledOnReady.current && !isMapContainerReused()) {
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Mark the container to avoid reuse
      if (map._container) {
        map._container.classList.add('leaflet-container-reused');
      }
      
      // Wait until the map is fully initialized before calling onMapReady
      setTimeout(() => {
        try {
          // Make sure the map and its container still exist
          if (map && map.getContainer && map.getContainer()) {
            // Try to invalidate the map size, but don't fail if it doesn't work
            try {
              map.invalidateSize(false);
            } catch (err) {
              console.warn('Initial invalidateSize failed, but continuing:', err);
            }
            
            // Wait a bit more to ensure map is fully rendered
            setTimeout(() => {
              try {
                // Double check that map is still valid
                if (map && map.getContainer && map.getContainer()) {
                  hasCalledOnReady.current = true;
                  console.log('Map container verified, calling onMapReady');
                  onMapReady(map);
                }
              } catch (error) {
                console.error('Map initialization failed after delay:', error);
              }
            }, 300);
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
        }
      }, 300);
    }
    
    return () => {
      // Reset flag on unmount
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
