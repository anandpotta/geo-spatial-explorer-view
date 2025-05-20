
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      // Ensure the map is properly attached to the DOM before doing operations
      const container = map.getContainer();
      if (!container || !document.body.contains(container)) {
        console.warn('Map container is not in DOM yet, delaying initialization');
        return;
      }
      
      try {
        // Ensure the map is properly sized with a safer approach
        setTimeout(() => {
          if (map && map._loaded) {
            try {
              map.invalidateSize(true);
            } catch (err) {
              console.warn('Error during invalidateSize:', err);
            }
          }
        }, 300);
        
        // Store map instance globally for marker positioning
        (window as any).leafletMapInstance = map;
        
        // Create a custom event for map movement
        const createMapMoveEvent = () => {
          window.dispatchEvent(new CustomEvent('mapMove'));
        };
        
        // Listen to map events only after the map is properly initialized
        setTimeout(() => {
          if (map && map._loaded) {
            // Add event listeners
            map.on('move', createMapMoveEvent);
            map.on('zoom', createMapMoveEvent);
            map.on('viewreset', createMapMoveEvent);
            map.on('resize', () => {
              console.log('Map resized, invalidating size');
              try {
                map.invalidateSize(true);
                createMapMoveEvent();
              } catch (err) {
                console.warn('Error during resize invalidation:', err);
              }
            });
            
            // Call the parent's onMapReady callback
            onMapReady(map);
            console.log('Map reference provided to parent component');
            
            // Force another invalidateSize after a bit more time
            // to ensure the map is fully rendered
            setTimeout(() => {
              try {
                if (map && map._loaded && document.body.contains(map.getContainer())) {
                  map.invalidateSize(true);
                }
              } catch (err) {
                console.warn('Error during delayed invalidation:', err);
              }
            }, 500);
          }
        }, 300);
        
        // Cleanup event listeners when component unmounts
        return () => {
          if (map && map._loaded) {
            try {
              map.off('move', createMapMoveEvent);
              map.off('zoom', createMapMoveEvent);
              map.off('viewreset', createMapMoveEvent);
              map.off('resize');
            } catch (err) {
              console.warn('Error removing map event listeners:', err);
            }
          }
        };
      } catch (err) {
        console.error('Error in MapReference setup:', err);
      }
    }
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
