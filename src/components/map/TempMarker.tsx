
import React, { useRef, useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import NewMarkerForm from './NewMarkerForm';

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

  // Force popup to open when marker is created
  useEffect(() => {
    if (markerRef.current && !isProcessing) {
      // Small delay to ensure marker is fully rendered
      const timer = setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
          setIsPopupOpen(true);
          console.log('Temp marker popup opened');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [position, isProcessing]);

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

  const handleSave = () => {
    if (isProcessing) return;
    setIsPopupOpen(false);
    onSave();
  };

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
          // Force popup open when added
          setTimeout(() => {
            if (markerRef.current) {
              markerRef.current.openPopup();
              setIsPopupOpen(true);
            }
          }, 50);
        }
      }}
    >
      <Popup 
        closeOnClick={false} 
        autoClose={false}
        closeButton={true}
        autoPan={true}
        className="marker-popup"
        maxWidth={300}
        minWidth={250}
        keepInView={true}
        eventHandlers={{
          popupopen: () => {
            console.log('Popup opened');
            setIsPopupOpen(true);
          },
          popupclose: () => {
            console.log('Popup closed');
            setIsPopupOpen(false);
          }
        }}
      >
        <NewMarkerForm
          markerName={markerName}
          setMarkerName={setMarkerName}
          markerType={markerType}
          setMarkerType={setMarkerType}
          onSave={handleSave}
          disabled={isProcessing}
        />
      </Popup>
    </Marker>
  );
};

export default TempMarker;
