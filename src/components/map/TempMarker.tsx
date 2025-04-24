import React, { useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
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

const TempMarker = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}: TempMarkerProps) => {
  // Generate a unique key for the marker based on its position
  const markerKey = `temp-marker-${position[0]}-${position[1]}-${Date.now()}`;
  
  // Update global reference for position updates and set flags
  useEffect(() => {
    // Immediately and aggressively set these flags to prevent map from moving
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    console.log('TempMarker mounted - enforcing tempMarkerPlaced=true and userHasInteracted=true');
    
    // Make sure window.tempMarkerPositionUpdate exists
    if (window.tempMarkerPositionUpdate) {
      // Initial update to ensure correct position
      const safePosition: [number, number] = [...position];
      window.tempMarkerPositionUpdate(safePosition);
    }
    
    return () => {
      // If component unmounts, set the temp marker to null, but KEEP the flags
      if (window.tempMarkerPositionUpdate) {
        // We use setTimeout to avoid state updates during render
        setTimeout(() => window.tempMarkerPositionUpdate && window.tempMarkerPositionUpdate(null), 0);
      }
    };
  }, [position]);
  
  return (
    <Marker 
      key={markerKey}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          
          // Reinforce user interaction flags when marker is dragged
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
          
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

export default TempMarker;
