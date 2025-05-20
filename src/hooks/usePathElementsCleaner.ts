
import { useEffect } from 'react';

export function usePathElementsCleaner(clearPathElements: () => void) {
  // Effect to listen for clear all events
  useEffect(() => {
    const handleClearAll = () => {
      console.log('Clear all SVG paths triggered');
      clearPathElements();
    };
    
    window.addEventListener('clearAllSvgPaths', handleClearAll);
    window.addEventListener('mapRefresh', handleClearAll);
    window.addEventListener('clearAllDrawings', handleClearAll);
    
    return () => {
      window.removeEventListener('clearAllSvgPaths', handleClearAll);
      window.removeEventListener('mapRefresh', handleClearAll);
      window.removeEventListener('clearAllDrawings', handleClearAll);
    };
  }, [clearPathElements]);
}
