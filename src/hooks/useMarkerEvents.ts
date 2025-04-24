import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function useMarkerEvents(map: L.Map | null) {
  const mapRef = useRef<L.Map | null>(map);
  
  // Keep the ref updated when the map changes
  useEffect(() => {
    mapRef.current = map;
  }, [map]);
  
  useEffect(() => {
    // Disable map keyboard events while marker form is active
    const preventMapKeyboardEvents = (e: KeyboardEvent) => {
      // Check if the event target is an input or form element from our popup
      const target = e.target as HTMLElement;
      
      // If the target is within our marker form, let it handle keyboard events
      if (target && 
         (target.closest('.marker-form-popup') || 
          target.closest('#marker-form') || 
          target.id === 'marker-name')) {
        // Allow the event to continue normally for form inputs
        return;
      }
      
      // Otherwise prevent map keyboard interactions
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
  }, []);
}
