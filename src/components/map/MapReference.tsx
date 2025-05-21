
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const initialized = useRef(false);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (!map || initialized.current || !mountedRef.current) {
      return;
    }
    
    console.log('Map reference provided');
    
    // Verify map container is valid before proceeding
    if (!map.getContainer() || !document.body.contains(map.getContainer())) {
      console.warn("Map container not verified, skipping reference assignment");
      return;
    }
    
    console.log('Map container verified, storing reference');
    initialized.current = true;
    
    // Store map instance globally for marker positioning
    (window as any).leafletMapInstance = map;
    
    // Create a custom event for map movement
    const createMapMoveEvent = () => {
      window.dispatchEvent(new CustomEvent('mapMove'));
    };
    
    // Listen to map events
    map.on('move', createMapMoveEvent);
    map.on('zoom', createMapMoveEvent);
    map.on('viewreset', createMapMoveEvent);
    
    // Force redraw of map to ensure all controls are visible
    const initializeMapWithDelay = setTimeout(() => {
      try {
        // Verify map is still valid before accessing methods
        if (mountedRef.current && map && map.getContainer && 
            document.body.contains(map.getContainer())) {
          console.log('Invalidating map size');
          map.invalidateSize();
          
          // Initialize drawing handler if it exists on the map
          if ((L.Draw as any) && (L.Draw as any).Polygon) {
            try {
              console.log('Initializing polygon drawing');
              // Ensure polygon drawing works correctly by forcing initialization
              (L.Draw as any).Polygon.prototype._enabled = true;
              
              // Make sure vertex markers are visible
              const style = document.createElement('style');
              style.innerHTML = `
                .leaflet-draw-tooltip {
                  background: #333;
                  background: rgba(0, 0, 0, 0.8);
                  border: none;
                  border-radius: 4px;
                  color: #fff;
                  font: 12px/18px "Helvetica Neue", Arial, Helvetica, sans-serif;
                  margin-left: 20px;
                  margin-top: -21px;
                  padding: 4px 8px;
                  position: absolute;
                  visibility: visible !important;
                  white-space: nowrap;
                  z-index: 6;
                }
                .leaflet-draw-guide-dash {
                  background-color: #0ff;
                  border-radius: 2px;
                  height: 2px;
                  opacity: 0.8;
                  position: absolute;
                  width: 5px;
                  z-index: 5;
                }
                .leaflet-draw-tooltip-single {
                  margin-top: -12px;
                }
                .leaflet-marker-draggable {
                  cursor: move;
                  opacity: 1 !important;
                }
              `;
              document.head.appendChild(style);
              
              // Force a refresh of the map viewport
              map.fire('viewreset');
              
              console.log('Map initialization complete, ready for drawing');
            } catch (e) {
              console.error("Error initializing polygon drawing:", e);
            }
          }
          
          // Call the parent's onMapReady callback
          if (typeof onMapReady === 'function') {
            console.log('Calling onMapReady callback');
            onMapReady(map);
          }
          
          console.log('Initial map invalidation completed');
        }
      } catch (err) {
        console.error("Error initializing map reference:", err);
      }
    }, 500);
    
    return () => {
      clearTimeout(initializeMapWithDelay);
      
      try {
        if (map && typeof map.off === 'function' && mountedRef.current) {
          map.off('move', createMapMoveEvent);
          map.off('zoom', createMapMoveEvent);
          map.off('viewreset', createMapMoveEvent);
        }
      } catch (err) {
        console.error("Error cleaning up map event listeners:", err);
      }
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
