
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
  
  // Add data attribute to marker icon and create persistent tooltip
  useEffect(() => {
    if (markerRef.current) {
      const icon = markerRef.current.getElement();
      if (icon) {
        icon.setAttribute('data-marker-id', marker.id);
        
        // Remove any existing tooltip first to prevent duplicates
        const existingTooltip = icon.querySelector('.marker-tooltip');
        if (existingTooltip) {
          existingTooltip.remove();
        }
        
        // Create tooltip for the marker
        const tooltip = document.createElement('div');
        tooltip.className = 'marker-tooltip bg-white px-2 py-0.5 rounded shadow text-sm absolute z-50';
        tooltip.style.left = '25px';
        tooltip.style.top = '0';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.transform = 'translateY(-50%)';
        tooltip.style.border = '1px solid #ccc';
        tooltip.setAttribute('data-marker-tooltip-id', marker.id);
        tooltip.textContent = marker.name;
        icon.appendChild(tooltip);
      }
    }
    
    // When a user marker is created, we should clean up any search markers
    // that might be at almost the same location to avoid duplicate markers
    if (markerRef.current && markerRef.current._map) {
      const map = markerRef.current._map;
      const userPos = markerRef.current.getLatLng();
      
      // Find and remove search result markers near this position
      map.eachLayer(layer => {
        if (layer instanceof L.Marker && 
            layer.getElement()?.getAttribute('data-search-marker') === 'true') {
          
          const searchPos = layer.getLatLng();
          
          // If the search marker is very close to this user marker, remove it
          if (Math.abs(searchPos.lat - userPos.lat) < 0.0001 && 
              Math.abs(searchPos.lng - userPos.lng) < 0.0001) {
            map.removeLayer(layer);
          }
        }
      });
    }
  }, [marker.id, marker.name]);
  
  // Cleanup marker when component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        const leafletElement = markerRef.current;
        // Ensure marker is properly removed from the map
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
      
      // Clean up any orphaned marker icons with this ID
      setTimeout(() => {
        const orphanedIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${marker.id}"]`);
        orphanedIcons.forEach(icon => {
          if (icon.parentNode) {
            icon.parentNode.removeChild(icon);
          }
        });
      }, 0);
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
