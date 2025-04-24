import React, { useEffect, useRef } from 'react';
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
  // Use a ref to track marker initialization
  const isInitializedRef = useRef(false);
  // Keep reference to any cleanup interval
  const flagIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Only run this once per marker instance
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Set these flags immediately to prevent ANY map navigation
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    
    console.log('TempMarker mounted - enforcing tempMarkerPlaced=true and userHasInteracted=true');
    
    // Update position if the window function exists
    if (window.tempMarkerPositionUpdate) {
      window.tempMarkerPositionUpdate([...position]);
    }
    
    // Save position to localStorage as backup
    try {
      localStorage.setItem('tempMarkerPosition', JSON.stringify(position));
    } catch (error) {
      console.error('Failed to store marker in localStorage:', error);
    }
    
    // Set interval to periodically reinforce flags but not too frequently
    flagIntervalRef.current = window.setInterval(() => {
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    }, 2000); // Less frequent updates
    
    return () => {
      // Clean up interval
      if (flagIntervalRef.current !== null) {
        clearInterval(flagIntervalRef.current);
        flagIntervalRef.current = null;
      }
      
      // Keep flags set even after unmount
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    };
  }, [position]);
  
  // Handler for saving the marker that prevents propagation
  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSave();
  };
  
  return (
    <Marker 
      key={markerKey}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragstart: (e) => {
          // Prevent event propagation
          L.DomEvent.stopPropagation(e.originalEvent);
          
          // Reinforce interaction flags
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
        },
        dragend: (e) => {
          // Prevent event propagation
          L.DomEvent.stopPropagation(e.originalEvent);
          
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
        },
        click: (e) => {
          // Prevent event propagation to stop map clicks from interfering
          L.DomEvent.stopPropagation(e.originalEvent);
        },
        popupopen: (e) => {
          // Prevent event propagation
          L.DomEvent.stopPropagation(e.originalEvent);
        }
      }}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={handleSave}
      />
    </Marker>
  );
};

export default TempMarker;
