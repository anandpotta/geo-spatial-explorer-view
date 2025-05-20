
import L from 'leaflet';

/**
 * Enhances path elements to preserve SVG data during drawing
 */
export const enhancePathPreservation = (map: L.Map): () => void => {
  if (!map) return () => {};
  
  // Add rectangle enhancement
  const originalRectDrawShape = enhanceRectangleDrawing();
  
  // Create a mutation observer to watch for newly added SVG paths
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node contains SVG paths
          if (node instanceof Element) {
            const paths = node.querySelectorAll('path.leaflet-interactive');
            paths.forEach((path) => {
              // Store the original path data for retrieval
              const pathData = path.getAttribute('d');
              if (pathData) {
                path.setAttribute('data-original-path', pathData);
                
                // Apply performance optimizations
                path.setAttribute('shape-rendering', 'geometricPrecision');
                (path as HTMLElement).style.transform = 'translateZ(0)';
                
                // Add visibility class
                path.classList.add('visible-path-stroke');
              }
            });
          }
        });
      }
    });
  });
  
  // Start observing the map container for SVG changes
  const container = map.getContainer();
  if (container) {
    observer.observe(container, { 
      childList: true, 
      subtree: true 
    });
  }
  
  // Return cleanup function
  return () => {
    observer.disconnect();
    
    // Restore original methods
    if (originalRectDrawShape && L.Draw && (L.Draw as any).Rectangle) {
      (L.Draw as any).Rectangle.prototype._drawShape = originalRectDrawShape;
    }
  };
};

/**
 * Imports the rectangle utils function
 * This is defined externally but referenced here
 */
import { enhanceRectangleDrawing } from './rectangle-utils';
