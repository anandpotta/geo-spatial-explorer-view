
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
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
      setTimeout(() => {
        map.invalidateSize();
        
        // Initialize drawing handler if it exists on the map
        if ((L.Draw as any) && (L.Draw as any).Polygon) {
          try {
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
              .leaflet-draw-draw-polygon,
              .leaflet-draw-draw-polyline,
              .leaflet-draw-draw-rectangle,
              .leaflet-draw-draw-circle,
              .leaflet-draw-edit-edit,
              .leaflet-draw-edit-remove,
              .leaflet-draw-draw-marker {
                display: block !important;
                visibility: visible !important;
              }
            `;
            document.head.appendChild(style);
          } catch (e) {
            console.error("Error initializing polygon drawing:", e);
          }
        }
        
        // Call the parent's onMapReady callback
        onMapReady(map);
      }, 500);
      
      return () => {
        map.off('move', createMapMoveEvent);
        map.off('zoom', createMapMoveEvent);
        map.off('viewreset', createMapMoveEvent);
      };
    }
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
