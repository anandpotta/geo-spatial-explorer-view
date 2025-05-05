
/**
 * Main utilities for handling SVG clip masks and images
 */
import { rotateImageInClipMask, scaleImageInClipMask } from './svg-image-operations';

/**
 * Finds an SVG path element by drawing ID with multiple selector strategies
 */
export const findSvgPathByDrawingId = (drawingId: string): SVGPathElement | null => {
  // First try the data-drawing-id attribute (primary method)
  let pathElement = document.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
  
  if (!pathElement) {
    // Try a broader selector on leaflet-interactive class
    pathElement = document.querySelector(`.leaflet-interactive[data-drawing-id="${drawingId}"]`) as SVGPathElement;
  }
  
  if (!pathElement) {
    // Look for path elements in all SVG elements on the page
    const allSvgs = document.querySelectorAll('svg');
    for (const svg of Array.from(allSvgs)) {
      const paths = svg.querySelectorAll('path');
      for (const path of Array.from(paths)) {
        if (path.getAttribute('data-drawing-id') === drawingId) {
          pathElement = path as SVGPathElement;
          break;
        }
      }
      if (pathElement) break;
    }
  }
  
  // Try leaflet-specific panes as a fallback
  if (!pathElement) {
    // Look in all leaflet panes
    const panes = document.querySelectorAll('.leaflet-pane');
    for (const pane of Array.from(panes)) {
      // Try direct path selector
      const directPath = pane.querySelector(`path[data-drawing-id="${drawingId}"]`);
      if (directPath) {
        pathElement = directPath as SVGPathElement;
        break;
      }
      
      // Try to find any path in the overlay pane
      const overlayPane = document.querySelector('.leaflet-overlay-pane');
      if (overlayPane) {
        const paths = overlayPane.querySelectorAll('path.leaflet-interactive');
        
        // Debug how many paths were found
        console.log(`Found ${paths.length} path elements in overlay pane`);
        
        // Check each path for the drawing ID
        for (const path of Array.from(paths)) {
          const id = path.getAttribute('data-drawing-id');
          if (id === drawingId) {
            pathElement = path as SVGPathElement;
            break;
          }
        }
      }
    }
  }
  
  return pathElement;
};

// Export all functions from the clip mask and image operations modules
export {
  applyImageClipMask,
  removeClipMask
} from './svg-clip-mask-operations';

export { rotateImageInClipMask, scaleImageInClipMask };
