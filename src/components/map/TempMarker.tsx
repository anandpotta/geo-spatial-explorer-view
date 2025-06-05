
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

  // Force popup to open when marker is created/mounted
  useEffect(() => {
    console.log('TempMarker mounted at position:', position);
    
    const openPopup = () => {
      if (markerRef.current) {
        try {
          console.log('Attempting to open popup');
          markerRef.current.openPopup();
          
          // Focus input after a short delay
          setTimeout(() => {
            const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
              console.log('Input focused and selected');
            }
          }, 100);
        } catch (e) {
          console.error('Error opening popup:', e);
        }
      }
    };

    // Multiple attempts with increasing delays
    const timeouts = [50, 200, 500].map(delay => 
      setTimeout(openPopup, delay)
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  if (isProcessing) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={markerRef}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          console.log('Temp marker added to map');
          // Force popup open when marker is added
          setTimeout(() => {
            if (e.target && e.target.openPopup) {
              e.target.openPopup();
              console.log('Popup opened via add event');
            }
          }, 100);
        },
        click: (e) => {
          console.log('Temp marker clicked, opening popup');
          e.target.openPopup();
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
