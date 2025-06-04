
import { useEffect } from 'react';
import L from 'leaflet';

interface UseTempMarkerEffectsProps {
  markerRef: React.MutableRefObject<L.Marker | null>;
  position: [number, number];
  isProcessing: boolean;
  setIsPopupOpen: (open: boolean) => void;
}

export const useTempMarkerEffects = ({
  markerRef,
  position,
  isProcessing,
  setIsPopupOpen
}: UseTempMarkerEffectsProps) => {
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
  }, [position, isProcessing, markerRef, setIsPopupOpen]);
};
