
import { useEffect, useRef } from 'react';

export function useClearDrawings(onClearAll?: () => void) {
  const wasRecentlyCleared = useRef(false);

  useEffect(() => {
    const handleClearEvent = () => {
      console.log('DrawTools detected clear event');
      wasRecentlyCleared.current = true;
      
      setTimeout(() => {
        wasRecentlyCleared.current = false;
      }, 1000);
      
      if (onClearAll) {
        onClearAll();
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
