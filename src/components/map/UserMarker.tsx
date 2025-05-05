import React, { useCallback, useRef, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerId = useRef<string>(marker.id);
  
  // If marker ID changes (unlikely but possible), keep ref updated
  useEffect(() => {
    markerId.current = marker.id;
  }, [marker.id]);
  
  const handleDragEnd = useCallback((e: any) => {
    const updatedMarker = e.target;
    const newPosition = updatedMarker.getLatLng();
    
    // Update marker position in local storage
    const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = savedMarkers.map((m: LocationMarker) => {
      if (m.id === markerId.current) {
        return {
          ...m,
          position: [newPosition.lat, newPosition.lng] as [number, number]
        };
      }
      return m;
    });
    
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch event to update other components with a unique timestamp
    window.dispatchEvent(new CustomEvent('markersUpdated', { 
      detail: { 
        timestamp: Date.now(),
        source: 'marker-drag'
      } 
    }));
  }, []);
  
  return (
    <Marker 
      position={marker.position} 
      key={`marker-${marker.id}`}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd
      }}
    >
      <MarkerPopup marker={marker} onDelete={onDelete} />
    </Marker>
  );
};

export default React.memo(UserMarker, (prevProps, nextProps) => {
  // Only re-render if the marker's essential properties have changed
  return (
    prevProps.marker.id === nextProps.marker.id &&
    prevProps.marker.position[0] === nextProps.marker.position[0] &&
    prevProps.marker.position[1] === nextProps.marker.position[1] &&
    prevProps.marker.name === nextProps.marker.name
  );
});
