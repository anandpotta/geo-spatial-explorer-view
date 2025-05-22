
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
    if (!markerRef.current || isDeleting) return;
    
    try {
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
    } catch (error) {
      console.error('Error updating marker position:', error);
    }
  }, [marker.id, isDeleting]);

  // Handler for deleting a marker safely
  const handleDelete = useCallback((id: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    // First close any open popups or tooltips
    if (markerRef.current) {
      try {
        markerRef.current.closeTooltip();
        markerRef.current.closePopup();
      } catch (e) {
        console.error('Error cleaning up marker before deletion:', e);
      }
    }
    
    // Then delete the marker
    onDelete(id);
    
    // Reset isDeleting state after a short delay
    setTimeout(() => {
      setIsDeleting(false);
    }, 100);
  }, [onDelete, isDeleting]);

  // Set up marker references
  const setMarkerInstance = (marker: L.Marker) => {
    if (marker && !markerRef.current) {
      markerRef.current = marker;
      setIsReady(true);
    }
  };

  // Cleanup function to prevent memory leaks
  useEffect(() => {
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
  }, []);
  
  return (
    <Marker 
      position={marker.position} 
      key={`marker-${marker.id}`}
      draggable={true}
      ref={setMarkerInstance}
      eventHandlers={{ dragend: handleDragEnd }}
    >
      <MarkerPopup 
        marker={marker} 
        onDelete={() => handleDelete(marker.id)} 
      />

      <Tooltip 
        direction="top" 
        offset={[0, -10]} 
        opacity={0.9}
        permanent={true}
      >
        <span className="font-medium">{marker.name}</span>
      </Tooltip>
    </Marker>
  );
};

export default React.memo(UserMarker);
