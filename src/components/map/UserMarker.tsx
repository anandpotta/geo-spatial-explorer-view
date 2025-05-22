
import React, { useCallback, useRef, useEffect } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);

  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
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
  }, [marker.id]);

  // Safe tooltip opening with error handling
  const safeOpenTooltip = useCallback(() => {
    if (!markerRef.current) return;
    
    try {
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openTooltip();
        }
      }, 100);
    } catch (error) {
      console.error('Could not open tooltip safely:', error);
    }
  }, []);

  useEffect(() => {
    safeOpenTooltip();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.closeTooltip();
          markerRef.current.closePopup();
        } catch (error) {
          console.error('Error cleaning up marker:', error);
        }
      }
    };
  }, [safeOpenTooltip]);
  
  const eventHandlers = {
    dragend: handleDragEnd,
    add: safeOpenTooltip
  };
  
  return (
    <Marker 
      position={marker.position} 
      key={`marker-${marker.id}`}
      draggable={true}
      ref={markerRef}
      eventHandlers={eventHandlers}
    >
      <MarkerPopup marker={marker} onDelete={onDelete} />

      <Tooltip 
        direction="top" 
        offset={[0, -10]} 
        opacity={0.9}
        permanent={true}
        className="custom-marker-tooltip"
      >
        <span className="font-medium">{marker.name}</span>
      </Tooltip>
    </Marker>
  );
};

export default React.memo(UserMarker);
