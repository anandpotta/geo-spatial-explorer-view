
import { useCallback } from 'react';
import L from 'leaflet';

interface UseTempMarkerHandlersProps {
  isProcessing: boolean;
}

export const useTempMarkerHandlers = ({ isProcessing }: UseTempMarkerHandlersProps) => {
  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
    if (isProcessing) return;
    
    const marker = e.target;
    if (marker && marker.getLatLng) {
      const newPosition = marker.getLatLng();
      if (window.tempMarkerPositionUpdate) {
        window.tempMarkerPositionUpdate([newPosition.lat, newPosition.lng]);
      }
    }
  }, [isProcessing]);

  const handleMarkerAdd = useCallback((markerRef: React.MutableRefObject<L.Marker | null>, setIsPopupOpen: (open: boolean) => void) => {
    return () => {
      console.log('Temp marker added to map');
      // Force popup open when added
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
          setIsPopupOpen(true);
        }
      }, 50);
    };
  }, []);

  return {
    handleDragEnd,
    handleMarkerAdd
  };
};
