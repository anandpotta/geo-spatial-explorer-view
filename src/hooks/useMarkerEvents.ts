
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function useMarkerEvents(map: L.Map | null) {
  useEffect(() => {
    // Disable ALL map keyboard events while marker is active
    const preventMapKeyboardEvents = (e: KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };
    
    document.addEventListener('keypress', preventMapKeyboardEvents, true);
    document.addEventListener('keydown', preventMapKeyboardEvents, true);
    document.addEventListener('keyup', preventMapKeyboardEvents, true);
    
    return () => {
      document.removeEventListener('keypress', preventMapKeyboardEvents, true);
      document.removeEventListener('keydown', preventMapKeyboardEvents, true);
      document.removeEventListener('keyup', preventMapKeyboardEvents, true);
    };
  }, [map]);
}
