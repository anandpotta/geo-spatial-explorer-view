
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const mapInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!map) return;

    // Ensure we don't try to initialize the same map multiple times
    if (mapInitializedRef.current) {
      console.log('Map already initialized, skipping duplicate initialization');
      return;
    }
    
    // Need to wait a bit to ensure the DOM is fully rendered
    const initMapWhenReady = () => {
      try {
        // Check that the map container is properly attached to the DOM
        const container = map.getContainer();
        if (!container || !document.body.contains(container)) {
          console.log('Map container not ready yet, will retry');
          setTimeout(initMapWhenReady, 100);
          return;
        }
        
        // Ensure the map panes are created
        if (!(map as any)._loaded || !(map as any)._panes || !(map as any)._panes.mapPane) {
          console.log('Map not fully loaded yet, will retry');
          setTimeout(initMapWhenReady, 100);
          return;
        }

        console.log('Map container verified, proceeding with initialization');
        mapInitializedRef.current = true;
        
        // Safe invalidateSize with error handling
        const safeInvalidateSize = () => {
          try {
            if (map && (map as any)._loaded && 
                (map as any)._panes && 
                (map as any)._panes.mapPane && 
                (map as any)._panes.mapPane._leaflet_pos) {
              map.invalidateSize(true);
            }
          } catch (err) {
            console.warn('Skipping invalidateSize due to map not being fully ready');
          }
        };

        // Store map instance globally for marker positioning
        (window as any).leafletMapInstance = map;
        
        // Create a custom event for map movement
        const createMapMoveEvent = () => {
          window.dispatchEvent(new CustomEvent('mapMove'));
        };
        
        // Add event listeners after validation
        map.on('move', createMapMoveEvent);
        map.on('zoom', createMapMoveEvent);
        map.on('viewreset', createMapMoveEvent);
        map.on('resize', () => {
          console.log('Map resized, invalidating size');
          safeInvalidateSize();
          createMapMoveEvent();
        });
        
        // Call the parent's onMapReady callback
        onMapReady(map);
        console.log('Map reference provided to parent component');
        
        // Do a safe invalidateSize after a delay
        setTimeout(safeInvalidateSize, 300);
        setTimeout(safeInvalidateSize, 1000); // Second attempt for extra safety
      } catch (err) {
        console.error('Error during map initialization:', err);
        // Retry initialization after a delay
        setTimeout(initMapWhenReady, 200);
      }
    };
    
    // Start the initialization process
    setTimeout(initMapWhenReady, 100);
    
    // Cleanup event listeners when component unmounts
    return () => {
      if (map && (map as any)._loaded) {
        try {
          map.off('move');
          map.off('zoom');
          map.off('viewreset');
          map.off('resize');
        } catch (err) {
          console.warn('Error removing map event listeners:', err);
        }
      }
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
