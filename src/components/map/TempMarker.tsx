
import React, { useRef, useState } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import TempMarkerPopup from './TempMarkerPopup';
import { useTempMarkerEffects } from '@/hooks/useTempMarkerEffects';
import { useTempMarkerHandlers } from '@/hooks/useTempMarkerHandlers';

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

  const { handleDragEnd, handleMarkerAdd } = useTempMarkerHandlers({ isProcessing });

  useTempMarkerEffects({
    markerRef,
    position,
    isProcessing,
    setIsPopupOpen
  });

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
        add: handleMarkerAdd(markerRef, setIsPopupOpen)
      }}
    >
      <TempMarkerPopup
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={onSave}
        isProcessing={isProcessing}
        isPopupOpen={isPopupOpen}
        setIsPopupOpen={setIsPopupOpen}
      />
    </Marker>
  );
};

export default TempMarker;
