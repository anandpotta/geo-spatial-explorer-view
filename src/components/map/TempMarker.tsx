
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

  const openPopupForced = () => {
    if (markerRef.current) {
      console.log('Forcing popup open for temp marker');
      try {
        markerRef.current.openPopup();
        
        // Focus input after popup opens
        setTimeout(() => {
          const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
          if (inputField) {
            inputField.focus();
            inputField.select();
            console.log('Input focused and selected');
          }
        }, 200);
      } catch (e) {
        console.error('Error opening popup:', e);
      }
    }
  };

  // Force popup to open when marker is created/mounted
  useEffect(() => {
    console.log('TempMarker mounted at position:', position);
    
    // Multiple attempts to open popup with different delays
    const timers = [100, 300, 500, 800].map(delay => 
      setTimeout(openPopupForced, delay)
    );
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
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
          console.log('Temp marker ref set');
          // Immediate attempt to open popup
          setTimeout(() => {
            openPopupForced();
          }, 50);
        }
      }}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          console.log('Temp marker added to map');
          setTimeout(() => {
            openPopupForced();
          }, 100);
        },
        click: (e) => {
          console.log('Temp marker clicked');
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
