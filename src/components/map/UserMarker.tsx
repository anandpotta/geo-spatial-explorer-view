
import React from 'react';
import { Marker } from 'react-leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';
import L from 'leaflet';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  // Create a unique key based on marker ID and a timestamp
  const markerKey = `marker-${marker.id}-${Date.now()}`;
  
  const handleDragEnd = (e: L.DragEndEvent) => {
    const updatedMarker = e.target;
    const newPosition = updatedMarker.getLatLng();
    
    // Update marker position in local storage
    const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = savedMarkers.map((m: LocationMarker) => {
      if (m.id === marker.id) {
        return {
          ...m,
          position: [newPosition.lat, newPosition.lng] as [number, number]
        };
      }
      return m;
    });
    
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent('markersUpdated'));
  };
  
  return (
    <Marker 
      position={marker.position} 
      key={marker.id}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd
      }}
      // Add unique identification to the marker DOM element
      icon={L.divIcon({
        className: `custom-marker marker-${marker.id}`,
        html: `<div class="marker-inner" data-marker-id="${marker.id}"></div>`,
        iconSize: L.point(25, 41),
        iconAnchor: L.point(12, 41)
      })}
    >
      <MarkerPopup marker={marker} onDelete={onDelete} />
    </Marker>
  );
};

export default UserMarker;
