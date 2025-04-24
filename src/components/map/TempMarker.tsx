
import React, { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import { useMarkerEvents } from '@/hooks/useMarkerEvents';
import { usePopupStyles } from '@/hooks/usePopupStyles';
import NewMarkerForm from './marker/NewMarkerForm';

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
  const map = useMap();
  const markerKey = useRef(`temp-marker-${position[0]}-${position[1]}-${Date.now()}`);
  
  // Apply the marker events and popup styles
  useMarkerEvents(map);
  usePopupStyles();
  
  // Add marker-specific class to the map container for CSS targeting
  useEffect(() => {
    const mapContainer = map.getContainer();
    if (mapContainer) {
      mapContainer.classList.add('marker-form-active');
    }
    
    // Set global flags for marker presence
    window.userHasInteracted = true;
    window.tempMarkerPlaced = true;
    
    return () => {
      // Remove the class when the marker is unmounted
      if (mapContainer) {
        mapContainer.classList.remove('marker-form-active');
      }
    };
  }, [map]);

  // Create a custom handler for updating marker position
  useEffect(() => {
    // Expose a global function to update the marker position from drag events
    window.tempMarkerPositionUpdate = (newPosition: [number, number]) => {
      console.log('Marker dragged to:', newPosition);
      // This will be used by the dragend event handler to update position state
    };
    
    return () => {
      // Clean up the global function when component unmounts
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  return (
    <Marker 
      key={markerKey.current}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragstart: (e) => {
          // Prevent map movement when dragging the marker
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
        },
        dragend: (e) => {
          // Ensure map panning is stopped
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          // Update position using the global handler if available
          if (window.tempMarkerPositionUpdate) {
            const newPosition = e.target.getLatLng();
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
