
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
    console.log('TempMarker mounted at position:', position);
    
    const openPopup = () => {
      if (markerRef.current) {
        console.log('Opening popup for temp marker');
        markerRef.current.openPopup();
        
        // Focus the input field after popup opens
        setTimeout(() => {
          const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
          if (inputField) {
            inputField.focus();
            inputField.select();
            console.log('Input focused and selected');
          }
        }, 100);
      }
    };

    // Try to open popup immediately and with retries
    const timer1 = setTimeout(openPopup, 50);
    const timer2 = setTimeout(openPopup, 150);
    const timer3 = setTimeout(openPopup, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [position]);

  if (isProcessing) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={(marker) => {
        if (marker) {
          markerRef.current = marker;
          console.log('Temp marker ref set, opening popup');
          // Immediate attempt to open popup
          setTimeout(() => {
            if (marker) {
              marker.openPopup();
            }
          }, 10);
        }
      }}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          console.log('Temp marker added to map');
          const marker = e.target;
          setTimeout(() => {
            if (marker && marker.openPopup) {
              marker.openPopup();
              console.log('Popup opened via add event');
            }
          }, 20);
        },
        popupopen: (e) => {
          console.log('Popup opened for temp marker');
          setTimeout(() => {
            const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
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
