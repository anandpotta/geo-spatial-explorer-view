
import { useEffect } from 'react';

export function usePathElementsCleaner(clearPathElements: () => void) {
  // Effect to listen for clear all events
  useEffect(() => {
    const handleClearAll = () => {
      console.log('Clear all SVG paths triggered');
      clearPathElements();
      
      // Add direct DOM manipulation as a failsafe
      setTimeout(() => {
        // Find all SVG paths in the overlay pane and force remove them
        const overlayPanes = document.querySelectorAll('.leaflet-overlay-pane');
        overlayPanes.forEach(pane => {
          const paths = pane.querySelectorAll('path');
          paths.forEach(path => {
            path.remove();
          });
        });
      }, 50);
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
