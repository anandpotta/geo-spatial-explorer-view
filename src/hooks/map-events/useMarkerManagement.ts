
import { useRef } from 'react';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

/**
 * Hook to handle marker management on the map
 */
export function useMarkerManagement() {
  // Check if a marker already exists at the location
  const checkMarkerExists = (map: L.Map, position: [number, number]) => {
    let markerExists = false;
    
    try {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer.getLatLng) {
          const pos = layer.getLatLng();
          if (Math.abs(pos.lat - position[0]) < 0.0001 && 
              Math.abs(pos.lng - position[1]) < 0.0001) {
            markerExists = true;
          }
        }
      });
    } catch (err) {
      console.error('Error checking existing markers:', err);
    }
    
    return markerExists;
  };

  // Add a marker at the specified position
  const addMarker = (map: L.Map, position: [number, number], popupContent: string) => {
    try {
      if (!isMapValid(map)) {
        console.warn('Map not valid for adding marker');
        return null;
      }
      
      const marker = L.marker(position).addTo(map);
      marker.bindPopup(popupContent).openPopup();
      return marker;
    } catch (markerErr) {
      console.error('Error adding marker:', markerErr);
      return null;
    }
  };

  return {
    checkMarkerExists,
    addMarker
  };
}
