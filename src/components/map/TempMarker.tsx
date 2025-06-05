
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
    console.log('TempMarker useEffect triggered, position:', position, 'isProcessing:', isProcessing);
    
    if (markerRef.current && !isProcessing) {
      console.log('Attempting to open popup for temp marker');
      
      // Multiple attempts to ensure popup opens with proper timing
      const openPopupWithRetries = () => {
        let attempts = 0;
        const maxAttempts = 5;
        
        const tryOpen = () => {
          attempts++;
          console.log(`Popup open attempt ${attempts}`);
          
          if (markerRef.current) {
            try {
              markerRef.current.openPopup();
              console.log('Popup opened successfully on attempt', attempts);
              
              // Focus input after popup opens
              setTimeout(() => {
                const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
                if (inputField) {
                  inputField.focus();
                  inputField.select();
                  console.log('Input focused successfully');
                } else {
                  console.log('Input field not found after popup open');
                }
              }, 200);
              
            } catch (error) {
              console.error('Error opening popup on attempt', attempts, error);
              
              // Retry if not max attempts
              if (attempts < maxAttempts) {
                setTimeout(tryOpen, 100 * attempts);
              }
            }
          } else {
            console.log('Marker ref not available on attempt', attempts);
            
            // Retry if not max attempts
            if (attempts < maxAttempts) {
              setTimeout(tryOpen, 100 * attempts);
            }
          }
        };
        
        // Start trying immediately
        tryOpen();
      };
      
      // Start opening popup with a small delay
      setTimeout(openPopupWithRetries, 100);
    }
  }, [position, isProcessing, markerRef.current]);

  if (isProcessing) {
    return null;
  }

  return (
    <Marker
      position={position}
      ref={(marker) => {
        if (marker) {
          markerRef.current = marker;
          console.log('Temp marker ref set successfully');
        }
      }}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: (e) => {
          console.log('Temp marker added to map event fired');
          const marker = e.target;
          if (marker && marker.openPopup) {
            // Immediate popup open attempt when added
            setTimeout(() => {
              try {
                marker.openPopup();
                console.log('Popup opened via add event');
              } catch (err) {
                console.error('Error opening popup via add event:', err);
              }
            }, 50);
          }
        },
        popupopen: (e) => {
          console.log('Popup opened event fired for temp marker');
          setTimeout(() => {
            const inputField = document.querySelector('.leaflet-popup-content input') as HTMLInputElement;
            if (inputField) {
              inputField.focus();
              inputField.select();
              console.log('Input focused via popup open event');
            }
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
