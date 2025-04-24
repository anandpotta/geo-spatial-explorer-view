
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
  const map = useMap(); // Using useMap from react-leaflet instead of useMapEvents
  const markerKey = useRef(`temp-marker-${position[0]}-${position[1]}-${Date.now()}`);
  
  useMarkerEvents(map);
  usePopupStyles();
  
  // Set global flags for marker presence
  useEffect(() => {
    window.userHasInteracted = true;
    window.tempMarkerPlaced = true;
    
    return () => {
      // Don't reset flags on unmount as they might be needed elsewhere
    };
  }, []);

  return (
    <Marker 
      key={markerKey.current}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragstart: (e) => {
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
        },
        dragend: (e) => {
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
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
