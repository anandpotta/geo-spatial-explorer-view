
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
      console.log('Opening temp marker popup for position:', position);
      
      // Multiple attempts to ensure popup opens
      const openPopup = () => {
        if (markerRef.current) {
          try {
            markerRef.current.openPopup();
            console.log('Popup opened successfully');
            
            // Focus input after popup opens
            setTimeout(() => {
              const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
              if (inputField) {
                inputField.focus();
                inputField.select();
                console.log('Input focused');
              }
            }, 150);
          } catch (error) {
            console.error('Error opening popup:', error);
          }
        }
      };

      // Try opening popup with multiple timing attempts
      setTimeout(openPopup, 50);
      setTimeout(openPopup, 150);
      setTimeout(openPopup, 300);
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
        console.log('Temp marker ref set:', !!marker);
      }}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          console.log('Temp marker added to map');
          const marker = e.target;
          if (marker && marker.openPopup) {
            // Immediate popup open attempt
            setTimeout(() => {
              marker.openPopup();
              console.log('Popup opened via add event');
            }, 10);
          }
        },
        popupopen: (e) => {
          console.log('Popup opened event fired');
          setTimeout(() => {
            const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
              console.log('Input focused via popup open event');
            }
          }, 100);
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
