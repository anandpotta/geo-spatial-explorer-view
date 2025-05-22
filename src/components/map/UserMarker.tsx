
import React, { useCallback, useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (markerRef.current) {
      // Ensure tooltip is shown by default
      const leafletElement = markerRef.current;
      setTimeout(() => {
        try {
          leafletElement.openTooltip();
        } catch (error) {
          console.error('Could not open tooltip:', error);
        }
      }, 100);
    }
  }, []);
  
  return (
    <Marker 
      position={marker.position} 
      key={`marker-${marker.id}`}
      draggable={true}
      ref={markerRef}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          // Open tooltip on add
          setTimeout(() => {
            try {
              const leafletElement = markerRef.current;
              if (leafletElement) {
                leafletElement.openTooltip();
              }
            } catch (error) {
              console.error('Could not open tooltip on add:', error);
            }
          }, 100);
        }
      }}
    >
      <MarkerPopup marker={marker} onDelete={onDelete} />

      {/* Add permanent tooltip showing the marker name */}
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
