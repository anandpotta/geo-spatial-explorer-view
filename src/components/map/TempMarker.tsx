
import React from 'react';
import { Marker } from 'react-leaflet';
import NewMarkerForm from './NewMarkerForm';
import L from 'leaflet';

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
  // Create a custom marker with higher z-index to ensure it's on top
  const markerOptions = {
    draggable: true,
    autoPan: true,
    zIndexOffset: 9999, // Higher z-index to ensure visibility
    eventHandlers: {
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
      add: () => {
        // Force popup to open when marker is added to the map
        setTimeout(() => {
          const markerElement = document.querySelector('.leaflet-marker-draggable');
          if (markerElement) {
            markerElement.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            }));
          }
        }, 100);
      }
    }
  };
  
  return (
    <Marker position={position} {...markerOptions}>
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={onSave}
      />
    </Marker>
  );
};

export default TempMarker;
