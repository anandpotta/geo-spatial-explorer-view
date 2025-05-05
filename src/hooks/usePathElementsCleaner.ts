
import { useEffect } from 'react';

/**
 * Hook to handle clearing path elements on clearAll events
 */
export function usePathElementsCleaner(clearPathElements: (() => void) | undefined) {
  useEffect(() => {
    const handleClearAllEvent = () => {
      if (clearPathElements) {
        clearPathElements();
      }
    };
    
    window.addEventListener('clearAllSvgPaths', handleClearAllEvent);
    
    return () => {
      window.removeEventListener('clearAllSvgPaths', handleClearAllEvent);
    };
  }, [clearPathElements]);
}
