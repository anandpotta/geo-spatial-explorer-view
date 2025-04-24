
import { useEffect, useRef } from 'react';

export function useClearDrawings(onClearAll?: () => void) {
  const wasRecentlyCleared = useRef(false);

  useEffect(() => {
    const handleClearEvent = () => {
      console.log('DrawTools detected clear event');
      wasRecentlyCleared.current = true;
      
      setTimeout(() => {
        console.log('Resetting wasRecentlyCleared flag after timeout');
        wasRecentlyCleared.current = false;
      }, 1500);
      
      if (onClearAll) {
        // Slight delay to ensure leaflet had time to process the clear operation
        setTimeout(() => {
          onClearAll();
        }, 50);
      }
    };
    
    window.addEventListener('clearAllDrawings', handleClearEvent);
    return () => {
      window.removeEventListener('clearAllDrawings', handleClearEvent);
    };
  }, [onClearAll]);

  return {
    wasRecentlyCleared
  };
}
