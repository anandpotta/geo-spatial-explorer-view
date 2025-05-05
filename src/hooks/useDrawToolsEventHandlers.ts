
import { useEffect } from 'react';

/**
 * Hook to handle events for drawing tools
 */
export function useDrawToolsEventHandlers(
  getPathElements: (() => NodeListOf<SVGPathElement>) | undefined, 
) {
  useEffect(() => {
    // Add event listener to check for clip mask application
    const handleFloorPlanUpdate = (e: Event) => {
      const drawingId = (e as CustomEvent)?.detail?.drawingId;
      if (drawingId) {
        console.log(`Floor plan updated for drawing ${drawingId}, triggering refresh`);
        // Force refresh all SVG paths to ensure clip masks are correctly applied
        if (getPathElements) {
          const paths = getPathElements();
          if (paths.length > 0) {
            // Force a redraw
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
            }, 100);
          }
        }
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdate);
    
    // Cleanup function
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdate);
    };
  }, [getPathElements]);
}
