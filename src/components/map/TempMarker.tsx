
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
    zIndexOffset: 1000, // Higher z-index
    eventHandlers: {
      dragend: (e: L.LeafletEvent) => {
        // Update marker position when dragged
        const marker = e.target;
        if (marker && marker.getLatLng) {
          const position = marker.getLatLng();
          // Update the position through the global handler
          if (window.tempMarkerPositionUpdate) {
            window.tempMarkerPositionUpdate([position.lat, position.lng]);
          }
        }
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
