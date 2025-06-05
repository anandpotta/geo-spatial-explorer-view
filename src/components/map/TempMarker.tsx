
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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

  // Force popup open immediately when marker is ready
  useEffect(() => {
    console.log('TempMarker: Effect triggered, marker ref:', !!markerRef.current, 'processing:', isProcessing);
    
    if (markerRef.current && !isProcessing) {
      // Multiple attempts to open popup with increasing delays
      const openPopup = () => {
        try {
          if (markerRef.current) {
            console.log('TempMarker: Opening popup via useEffect');
            markerRef.current.openPopup();
            setIsPopupOpen(true);
          }
        } catch (e) {
          console.error('TempMarker: Error opening popup:', e);
        }
      };

      // Immediate attempt
      openPopup();
      
      // Backup attempts
      const timeouts = [50, 150, 300, 500].map(delay => 
        setTimeout(openPopup, delay)
      );

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [markerRef.current, isProcessing]);

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
          console.log('TempMarker: Marker added to map');
          // Force popup open immediately when marker is added
          setTimeout(() => {
            if (e.target && e.target.openPopup) {
              console.log('TempMarker: Opening popup via add event');
              e.target.openPopup();
              setIsPopupOpen(true);
            }
          }, 50);
        },
        click: (e) => {
          console.log('TempMarker: Marker clicked');
          e.target.openPopup();
          setIsPopupOpen(true);
          
          if (e.originalEvent) {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
          }
        },
        popupopen: () => {
          console.log('TempMarker: Popup opened event');
          setIsPopupOpen(true);
          
          // Focus input after popup opens
          setTimeout(() => {
            const inputField = document.querySelector('.temp-marker-popup input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
              console.log('TempMarker: Input focused');
            }
          }, 100);
        },
        popupclose: () => {
          console.log('TempMarker: Popup closed event');
          setIsPopupOpen(false);
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
