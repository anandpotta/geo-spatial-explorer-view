
import { useEffect } from 'react';

export function useTempMarkerGlobal(setTempMarker: (pos: [number, number] | null) => void) {
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, [setTempMarker]);
}
