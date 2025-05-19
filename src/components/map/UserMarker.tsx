
import React, { useCallback, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';
import L from 'leaflet';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  
  // Add data attribute to marker icon
  useEffect(() => {
    if (markerRef.current) {
      const icon = markerRef.current.getElement();
      if (icon) {
        icon.setAttribute('data-marker-id', marker.id);
        
        // Create tooltip for the marker if it doesn't exist
        if (!icon.querySelector('.marker-tooltip')) {
          const tooltip = document.createElement('div');
          tooltip.className = 'marker-tooltip bg-white px-2 py-0.5 rounded shadow text-sm absolute z-50';
          tooltip.style.left = '25px';
          tooltip.style.top = '0';
          tooltip.style.pointerEvents = 'none';
          tooltip.setAttribute('data-marker-tooltip-id', marker.id);
          tooltip.textContent = marker.name;
          icon.appendChild(tooltip);
        }
      }
    }
  }, [marker.id, marker.name]);
  
  // Cleanup marker when component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        const leafletElement = markerRef.current;
        if (leafletElement && leafletElement.remove) {
          try {
            leafletElement.remove();
          } catch (error) {
            console.error('Error removing marker:', error);
          }
        }
      }
      
      // Also remove any tooltips associated with this marker
      const tooltips = document.querySelectorAll(`[data-marker-tooltip-id="${marker.id}"]`);
      tooltips.forEach(tooltip => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
    };
  }, [marker.id]);
  
  const handleDragEnd = useCallback((e: any) => {
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
  
  return (
    <Marker 
      position={marker.position} 
      key={`marker-${marker.id}`}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd
      }}
      ref={markerRef}
    >
      <MarkerPopup marker={marker} onDelete={onDelete} />
    </Marker>
  );
};

export default React.memo(UserMarker);
