
import React, { useEffect } from 'react';
import { Marker } from 'react-leaflet';
import NewMarkerForm from './NewMarkerForm';

interface TempMarkerProps {
  position: [number, number];
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
}

const TempMarker = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}: TempMarkerProps) => {
  // Create a stable instance ID to help React's reconciliation
  const instanceId = React.useRef(`temp-marker-${Date.now()}`).current;
  
  // Clean up any potential global references when component unmounts
  useEffect(() => {
    return () => {
      // Remove any global references to temp marker position
      if (window.tempMarkerPositionUpdate) {
        delete window.tempMarkerPositionUpdate;
      }
    };
  }, []);
  
  return (
    <Marker 
      key={`temp-marker-${instanceId}-${position[0].toFixed(6)}-${position[1].toFixed(6)}`}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          // Update the marker position in parent component state
          if (window.tempMarkerPositionUpdate) {
            window.tempMarkerPositionUpdate([newPosition.lat, newPosition.lng]);
          }
        }
      }}
    >
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

// Use React.memo to prevent unnecessary re-renders
export default React.memo(TempMarker);
