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
  // Generate a unique key for the marker based on its position to prevent remounting issues
  const markerKey = `temp-marker-${position[0]}-${position[1]}-${Date.now()}`;
  
  useEffect(() => {
    // Immediately and aggressively set these flags to prevent ANY map navigation
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    
    console.log('TempMarker mounted - enforcing tempMarkerPlaced=true and userHasInteracted=true');
    
    // Make sure window.tempMarkerPositionUpdate exists
    if (window.tempMarkerPositionUpdate) {
      // Initial update to ensure correct position
      window.tempMarkerPositionUpdate([...position]);
    }
    
    // Save position to localStorage as backup
    try {
      localStorage.setItem('tempMarkerPosition', JSON.stringify(position));
    } catch (error) {
      console.error('Failed to store marker in localStorage:', error);
    }
    
    // Set interval to continuously reinforce flags
    const flagInterval = setInterval(() => {
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    }, 500);
    
    return () => {
      clearInterval(flagInterval);
      
      // Keep flags set even after unmount
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    };
  }, [position]);
  
  return (
    <Marker 
      key={markerKey}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragstart: () => {
          // Reinforce interaction flags
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
        },
        dragend: (e) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          
          // Reinforce user interaction flags when marker is dragged
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
          
          // Update the marker position in parent component state
          if (window.tempMarkerPositionUpdate) {
            window.tempMarkerPositionUpdate([newPosition.lat, newPosition.lng]);
            
            // Backup position to localStorage
            try {
              localStorage.setItem('tempMarkerPosition', JSON.stringify([newPosition.lat, newPosition.lng]));
            } catch (error) {
              console.error('Failed to store marker position in localStorage:', error);
            }
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
