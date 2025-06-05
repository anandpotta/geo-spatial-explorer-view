
import React, { useRef, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import TempMarkerPopup from './TempMarkerPopup';

interface TempMarkerProps {
  position: [number, number];
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
  isProcessing?: boolean;
}

const TempMarker: React.FC<TempMarkerProps> = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isProcessing = false
}) => {
  const markerRef = useRef<L.Marker | null>(null);

  const handleDragEnd = (e: L.LeafletEvent) => {
    if (isProcessing) return;
    
    const marker = e.target;
    if (marker && marker.getLatLng) {
      const newPosition = marker.getLatLng();
      if (window.tempMarkerPositionUpdate) {
        window.tempMarkerPositionUpdate([newPosition.lat, newPosition.lng]);
      }
    }
  };

  // Force popup to open when marker is created
  useEffect(() => {
    if (markerRef.current && !isProcessing) {
      const timer = setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
          console.log('Temp marker popup opened');
          
          // Focus on input after popup opens
          setTimeout(() => {
            const inputField = document.querySelector('.leaflet-popup input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
            }
          }, 200);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [position, isProcessing]);

  if (isProcessing) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={(marker) => {
        markerRef.current = marker;
      }}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: () => {
          console.log('Temp marker added to map');
          setTimeout(() => {
            if (markerRef.current) {
              markerRef.current.openPopup();
            }
          }, 50);
        }
      }}
    >
      <TempMarkerPopup
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={onSave}
        isProcessing={isProcessing}
      />
    </Marker>
  );
};

export default TempMarker;
