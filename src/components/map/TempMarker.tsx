
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
  const [isMarkerReady, setIsMarkerReady] = useState(false);

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

  // Aggressive popup opening strategy
  const forceOpenPopup = () => {
    if (!markerRef.current || isProcessing) return;
    
    try {
      console.log('TempMarker: Attempting to force open popup');
      markerRef.current.openPopup();
      setPopupOpen(true);
      
      // Additional attempt to focus input
      setTimeout(() => {
        const inputField = document.querySelector('.temp-marker-popup input') as HTMLInputElement;
        if (inputField) {
          inputField.focus();
          inputField.select();
          console.log('TempMarker: Input focused and selected');
        } else {
          console.log('TempMarker: Input field not found');
        }
      }, 200);
      
    } catch (e) {
      console.error('TempMarker: Error opening popup:', e);
    }
  };

  // Multiple attempts to open popup when marker is created
  useEffect(() => {
    console.log('TempMarker: Mounted at position:', position, 'Ready:', isMarkerReady);
    
    if (!isMarkerReady) return;
    
    // Immediate attempt
    forceOpenPopup();
    
    // Backup attempts with increasing delays
    const timeouts = [150, 400, 800, 1500].map(delay => 
      setTimeout(() => {
        if (!popupOpen && markerRef.current) {
          console.log(`TempMarker: Retry attempt at ${delay}ms`);
          forceOpenPopup();
        }
      }, delay)
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [position, isMarkerReady, popupOpen]);

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
          console.log('TempMarker: Marker added to map, setting ready state');
          setIsMarkerReady(true);
          
          // Immediate popup attempt on add
          setTimeout(() => {
            if (e.target && e.target.openPopup) {
              console.log('TempMarker: Opening popup via add event');
              e.target.openPopup();
              setPopupOpen(true);
            }
          }, 100);
        },
        click: (e) => {
          console.log('TempMarker: Marker clicked, forcing popup open');
          e.target.openPopup();
          setPopupOpen(true);
          
          // Stop event propagation to prevent map click
          if (e.originalEvent) {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
          }
        },
        popupopen: () => {
          console.log('TempMarker: Popup opened event triggered');
          setPopupOpen(true);
          
          // Focus input when popup opens
          setTimeout(() => {
            const inputField = document.querySelector('.temp-marker-popup input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
              console.log('TempMarker: Input focused via popupopen event');
            }
          }, 100);
        },
        popupclose: () => {
          console.log('TempMarker: Popup closed event triggered');
          setPopupOpen(false);
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
        forceOpen={true}
      />
    </Marker>
  );
};

export default TempMarker;
