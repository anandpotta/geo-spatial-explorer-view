
import React, { useRef, useEffect } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import NewMarkerForm from './NewMarkerForm';

interface TempMarkerProps {
  position: [number, number];
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
}

const TempMarker: React.FC<TempMarkerProps> = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}) => {
  const markerRef = useRef<L.Marker | null>(null);

  // Update tooltip content when markerName changes
  useEffect(() => {
    if (markerRef.current && markerName) {
      const tooltipElement = markerRef.current.getTooltip();
      if (tooltipElement) {
        tooltipElement.setContent(`<span class="font-medium">${markerName || 'New Location'}</span>`);
      }
    }
  }, [markerName]);

  // Create a custom marker with higher z-index to ensure it's on top
  const markerOptions = {
    draggable: true,
    autoPan: true,
    zIndexOffset: 9999, // Higher z-index to ensure visibility
  };

  const eventHandlers = {
    dragend: (e: L.LeafletEvent) => {
      // Update marker position when dragged
      const marker = e.target;
      if (marker && marker.getLatLng) {
        const position = marker.getLatLng();
        // Update the position through the global handler
        if (window.tempMarkerPositionUpdate) {
          window.tempMarkerPositionUpdate([position.lat, position.lng]);
          console.log("Marker position updated:", [position.lat, position.lng]);
        }
      }
    },
    add: (e: L.LeafletEvent) => {
      // Force popup to open when marker is added to the map
      setTimeout(() => {
        try {
          const markerElement = document.querySelector('.leaflet-marker-draggable');
          if (markerElement) {
            markerElement.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            }));
          }
        } catch (error) {
          console.error("Error dispatching click on marker:", error);
        }
      }, 100);
    }
  };
  
  return (
    <Marker 
      position={position}
      ref={markerRef}
      draggable={true}
      autoPan={true}
      zIndexOffset={9999}
      eventHandlers={eventHandlers}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={onSave}
      />
      <Tooltip 
        direction="top" 
        offset={[0, -10]} 
        opacity={0.9}
        permanent={true}
        className="custom-marker-tooltip"
      >
        <span className="font-medium">{markerName || 'New Location'}</span>
      </Tooltip>
    </Marker>
  );
};

export default TempMarker;
