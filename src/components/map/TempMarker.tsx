
import React, { useRef, useEffect, useState } from 'react';
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
  const [popupOpen, setPopupOpen] = useState(false);

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
    
    const forcePopupOpen = () => {
      if (markerRef.current) {
        try {
          console.log('Forcing popup open for temp marker');
          markerRef.current.openPopup();
          setPopupOpen(true);
          
          // Focus input after popup opens
          setTimeout(() => {
            const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
              console.log('Input focused and selected');
            }
          }, 150);
        } catch (e) {
          console.error('Error opening popup:', e);
        }
      }
    };

    // Try multiple times with increasing delays to ensure popup opens
    const timeouts = [100, 300, 600, 1000].map(delay => 
      setTimeout(forcePopupOpen, delay)
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [position]);

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
          // Immediate attempt when marker is added to map
          setTimeout(() => {
            if (e.target && e.target.openPopup) {
              e.target.openPopup();
              setPopupOpen(true);
              console.log('Popup opened via add event');
            }
          }, 50);
        },
        click: (e) => {
          console.log('Temp marker clicked, opening popup');
          e.target.openPopup();
          setPopupOpen(true);
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
        forceOpen={popupOpen}
      />
    </Marker>
  );
};

export default TempMarker;
